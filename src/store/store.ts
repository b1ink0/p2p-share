import { writable } from "svelte/store";

export const config = {
  rtcConfig: {
    iceServers: [
      {
        urls: [
          "stun:stun1.1.google.com:19302",
          "stun:stun2.1.google.com:19302",
        ],
      },
    ],
  },
};

export const peer = {
  connection: writable<RTCPeerConnection | null>(null),
  dataChannel: writable<RTCDataChannel | null>(null),
};

export let file = writable<File | null>(null);

export const receiveData = {
  fileInfo: writable<Object | null>(null),
  fileData: writable<ArrayBuffer | null>(null),
  bytesReceived: writable<number>(0),
  inProgress: writable<boolean>(false),
};

export const status = {
  connected: writable<boolean>(false),
  progress: writable<number>(0),
  received: writable<boolean>(false),
  sent: writable<boolean>(false),
};

export const sdp = writable<string | null>(null);

export const currentId = writable<string>("");

export const stopCheckingForAnswer = writable<boolean>(false);

export const receiveId = writable<string>("");

