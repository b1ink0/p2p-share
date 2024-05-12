import { get } from "svelte/store";
import axios from "axios";
import {
  peer,
  config,
  file,
  receiveData,
  status,
  sdp,
  currentId,
  stopCheckingForAnswer,
  receiveId,
} from "../store/store";

// Generate a random 4-digit number
function generateId() {
  // Generate a random number between 1000 and 9999 (inclusive)
  const min = 1000;
  const max = 9999;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const checkForAnswer = async (i: number = 0): Promise<void> => {
  if (i > 20 || get(stopCheckingForAnswer)) return;

  try {
    const response = await axios.get(
      `${import.meta.env.VITE_SIGNALING_SERVER_URL}/getanswer/${get(currentId)}`
    );
    if (response.data.answer) {
      console.log(response.data);
      await addAnswer(response.data.answer);
    } else {
      setTimeout(() => {
        checkForAnswer(i + 1);
      }, 1000);
    }
  } catch (error) {
    console.log("Error:", error);
    setTimeout(() => {
      checkForAnswer(i + 1);
    }, 1000);
  }
};

const createPeerConnection = (type: string = ""): void => {
  const localPeer = new RTCPeerConnection(config.rtcConfig as RTCConfiguration);
  peer.dataChannel.set(createDataChannel(localPeer, "dataChannel"));
  // localPeer.on
  localPeer.onicecandidate = async (event) => {
    if (!event.candidate) return;
    console.log("onice", localPeer.localDescription);
    sdp.set(JSON.stringify(localPeer.localDescription));
    if (type === "answer") {
      await postRequest(
        { id: get(receiveId), answer: localPeer.localDescription },
        "answer"
      );
      return;
    }
    const id = generateId();
    currentId.set(id.toString());
    await postRequest({ id: id, offer: localPeer.localDescription }, "offer");
  };
  console.log(localPeer);
  peer.connection.set(localPeer);
};

const createOffer = async (): Promise<void> => {
  const connection = peer.connection;
  connection.subscribe(async (connection) => {
    if (!connection) return;

    const offer = await connection.createOffer();
    await connection.setLocalDescription(offer);
    console.log(offer);

    // await postRequest({ id: id, offer: offer }, "offer");
    await checkForAnswer();
  });
};

const createAnswer = async (offer: string = ""): Promise<void> => {
  const connection = peer.connection;
  connection.subscribe(async (connection) => {
    if (!connection) return;
    let localOffer: RTCSessionDescription;
    console.log(offer);
    if (offer === "") {
      localOffer = JSON.parse(
        prompt("Enter offer from other peer") as string
      ) as RTCSessionDescription;
    } else {
      localOffer = JSON.parse(offer) as RTCSessionDescription;
    }

    console.log(localOffer);
    setTimeout(async () => {
      await connection.setRemoteDescription(localOffer);

      const answer = await connection.createAnswer();
      await connection.setLocalDescription(answer);
      console.log(answer);

      // await postRequest({ id: get(receiveId), answer: answer }, "answer");
    }, 1000);
  });
};

const addAnswer = async (answer: string = ""): Promise<void> => {
  const connection = peer.connection;
  connection.subscribe(async (connection) => {
    if (!connection) return;
    let localAnswer: RTCSessionDescription;
    if (answer === "") {
      localAnswer = JSON.parse(
        prompt("Enter offer from other peer") as string
      ) as RTCSessionDescription;
    } else {
      localAnswer = JSON.parse(answer) as RTCSessionDescription;
    }
    console.log(localAnswer);
    await connection.setRemoteDescription(localAnswer);
  });
};

const postRequest = async (data: Object, type: string): Promise<string> => {
  const response = await axios.post(
    `${import.meta.env.VITE_SIGNALING_SERVER_URL}/${type}`,
    data
  );
  const resData = response.data;
  console.log(resData);
  return resData[type];
};

const getRequest = async (id: string, type: string): Promise<Object> => {
  const response = await axios.get(
    `${import.meta.env.VITE_SIGNALING_SERVER_URL}/${type}/${id}`
  );
  const resData = response.data;
  return resData;
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
  console.log(dataChannel);

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
    file.subscribe((file) => {
      if (!file) {
        alert("Please select a file to send");
        return;
      }

      if (dataChannel.readyState !== "open") {
        alert("Please connect to peer first");
        return;
      }

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

const connect = async (): Promise<void> => {
  await createPeerConnection("offer");
  setTimeout(async () => {
    await createOffer();
  }, 1000);
};

const receive = async (): Promise<void> => {
  createPeerConnection("answer");
  setTimeout(async () => {
    const remoteOffer = await getRequest(get(receiveId), "getoffer");
    console.log("re", remoteOffer);
    await createAnswer(remoteOffer.offer);
  }, 1000);
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
  connect,
};
