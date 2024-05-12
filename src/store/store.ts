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
