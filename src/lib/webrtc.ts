import { get } from "svelte/store";
import { peer, config, file, receiveData, status, sdp } from "../store/store";

const createPeerConnection = (): void => {
  const localPeer = new RTCPeerConnection(config.rtcConfig as RTCConfiguration);
  peer.dataChannel.set(createDataChannel(localPeer, "dataChannel"));
  // localPeer.on
  localPeer.onicecandidate = async (event) => {
    if (!event.candidate) return;
    console.log(localPeer.localDescription);
    sdp.set(JSON.stringify(localPeer.localDescription));
    // await requestServer({ candidate: event.candidate });
  };
  peer.connection.set(localPeer);
};

const createOffer = async (): Promise<void> => {
  const connection = peer.connection;
  connection.subscribe(async (connection) => {
    if (!connection) return;

    const offer = await connection.createOffer();
    await connection.setLocalDescription(offer);
    console.log(offer);
  });
};

const createAnswer = async (): Promise<void> => {
  const connection = peer.connection;
  connection.subscribe(async (connection) => {
    if (!connection) return;
    const offer = JSON.parse(
      prompt("Enter offer from other peer") as string
    ) as RTCSessionDescription;
    await connection.setRemoteDescription(offer);

    const answer = await connection.createAnswer();
    await connection.setLocalDescription(answer);
    console.log(answer);
  });
};

const addAnswer = async (): Promise<void> => {
  const connection = peer.connection;
  const dataChannel = peer.dataChannel;
  connection.subscribe(async (connection) => {
    if (!connection) return;
    const answer = JSON.parse(
      prompt("Enter answer from other peer") as string
    ) as RTCSessionDescription;
    await connection.setRemoteDescription(answer);
  });
};

const requestServer = async (data: Object): Promise<Object> => {
  //   const response = await fetch("http://localhost:3000", {
  // method: "POST",
  // headers: {
  //   "Content-Type": "application/json",
  // },
  // body: JSON.stringify(data),
  //   });
  //   return response.json();
  console.log(data);
  return {};
};

const createDataChannel = (
  peerConnection: RTCPeerConnection,
  label: string
): RTCDataChannel => {
  const dataChannel = peerConnection.createDataChannel(label, {
    negotiated: true,
    id: 0,
  });
  dataChannel.onopen = () => {
    console.log("Data channel is open");
    status.connected.set(true);
  };
  dataChannel.onclose = () => {
    console.log("Data channel is closed");
    status.connected.set(false);
  };
  dataChannel.onerror = (error) => {
    console.log("Data channel error:", error);
  };

  dataChannel.onmessage = (event) => {
    if (typeof event.data === "string") {
      const data = JSON.parse(event.data);
      if (data.fileName && data.fileSize) {
        receiveData.fileInfo.set(data);
        receiveData.inProgress.set(true);
        receiveData.bytesReceived.set(0);
      }
    } else {
      receiveData.fileData.update((fileData) => {
        const data = new Uint8Array(event.data);
        const newData = fileData
          ? new Uint8Array(fileData.length + data.length)
          : data;
        if (fileData) {
          newData.set(fileData, 0);
          newData.set(data, fileData.length);
        }
        receiveData.bytesReceived.update((bytesReceived) => {
          return bytesReceived + data.length;
        });
        return newData;
      });
    }
  };

  receiveData.bytesReceived.subscribe((bytesReceived) => {
    const fileInfo = get(receiveData.fileInfo);
    if (!fileInfo) return;
    status.progress.set(Math.floor((bytesReceived / fileInfo.fileSize) * 100));
    // if (!fileInfo || !fileData) return;
    if (bytesReceived === fileInfo?.fileSize) {
      console.log("File received successfully");
      status.received.set(true);
    }
  });

  return dataChannel;
};

const readNextChunk = (
  fileReader: FileReader,
  BYTES_PER_CHUNK: number,
  file: File,
  currentChunk: number
) => {
  var start = BYTES_PER_CHUNK * currentChunk;
  var end = Math.min(file.size, start + BYTES_PER_CHUNK);
  fileReader.readAsArrayBuffer(file.slice(start, end));
};

const send = (): void => {
  const dataChannel = peer.dataChannel;
  dataChannel.subscribe((dataChannel) => {
    if (!dataChannel) return;
    console.log(dataChannel);
    file.subscribe((file) => {
      if (!file) return;
      const BYTES_PER_CHUNK = 1200;
      let currentChunk = 0;
      let fileReader = new FileReader();

      dataChannel.send(
        JSON.stringify({
          fileName: file.name,
          fileSize: file.size,
        })
      );

      fileReader.onload = () => {
        dataChannel.send(fileReader.result);
        currentChunk++;
        receiveData.bytesReceived.update((bytesReceived) => {
          return bytesReceived + BYTES_PER_CHUNK;
        });
        status.progress.set(
          Math.floor(((currentChunk * BYTES_PER_CHUNK) / file.size) * 100)
        );
        if (BYTES_PER_CHUNK * currentChunk < file.size) {
          readNextChunk(fileReader, BYTES_PER_CHUNK, file, currentChunk);
        } else {
          status.sent.set(true);
          console.log("File sent successfully");
        }
      };

      readNextChunk(fileReader, BYTES_PER_CHUNK, file, currentChunk);
    });
  });
};

const saveFile = (): void => {
  const fileData = get(receiveData.fileData);
  const fileInfo = get(receiveData.fileInfo);
  if (!fileData || !fileInfo) return;
  const file = new Blob([fileData], { type: "application/octet-stream" });
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileInfo.fileName;
  a.click();
};

const receive = (): void => {
  const dataChannel = peer.dataChannel;
  dataChannel.subscribe((dataChannel) => {
    console.log(dataChannel);
    if (!dataChannel) return;
  });
};

const reset = (): void => {
  file.set(null);
  receiveData.fileInfo.set(null);
  receiveData.fileData.set(null);
  receiveData.bytesReceived.set(0);
  receiveData.inProgress.set(false);
  status.progress.set(0);
  status.received.set(false);
  status.sent.set(false);
};

export {
  createPeerConnection,
  createDataChannel,
  createOffer,
  createAnswer,
  addAnswer,
  send,
  receive,
  saveFile,
  reset,
};
