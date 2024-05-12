import { peer, config } from "../store/store";

const createPeerConnection = (): void => {
  const localPeer = new RTCPeerConnection(config.rtcConfig as RTCConfiguration);
  peer.dataChannel.set(createDataChannel(localPeer, "dataChannel"));
  // localPeer.on
  localPeer.onicecandidate = async (event) => {
    if (!event.candidate) return;
    console.log(localPeer.localDescription);
    // await requestServer({ candidate: event.candidate });
  }
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
  };
  dataChannel.onclose = () => {
    console.log("Data channel is closed");
  };
  dataChannel.onerror = (error) => {
    console.log("Data channel error:", error);
  };
  dataChannel.onmessage = (event) => {
    console.log("Data channel message:", event.data);
  };
  
  return dataChannel;
};

const send = (): void => {
  const dataChannel = peer.dataChannel;
  dataChannel.subscribe((dataChannel) => {
    if (!dataChannel) return;
    console.log(dataChannel);
    dataChannel.send("Hello, World!");
  });
};

const receive = (): void => {
  const dataChannel = peer.dataChannel;
  dataChannel.subscribe((dataChannel) => {
    console.log(dataChannel);
    if (!dataChannel) return;
  });
};

export {
  createPeerConnection,
  createDataChannel,
  createOffer,
  createAnswer,
  addAnswer,
  send,
  receive,
};
