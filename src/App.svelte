<script lang="ts">
  import { file, peer, receiveData, status, sdp } from "./store/store";
  import { onMount } from "svelte";
  import Button from "./components/Button.svelte";
  import {
    addAnswer,
    createAnswer,
    createOffer,
    createPeerConnection,
    reset,
    saveFile,
    send,
  } from "./lib/webrtc";

  const handleFileChange = (e: any) => {
    file.set(e.target.files[0]);
  };

  let progress = 0;
  status.progress.subscribe((value) => {
    progress = value;
  });

  let connectionStatus = false;
  status.connected.subscribe((value) => {
    connectionStatus = value;
  });

  let fileInfo = { name: "", size: 0 };
  file.subscribe((value) => {
    if (!value) return;
    fileInfo = { name: value.name, size: value.size };
  });

  let localsdp = "";
  sdp.subscribe((value) => {
    localsdp = value;
  });

  onMount(() => {
    createPeerConnection();
  });
</script>

<main class="flex flex-col justify-center items-center w-full">
  <div
    class="w-fit border-2 p-4 m-4 rounded-md gap-4 flex justify-center items-center flex-col"
  >
    <h1 class="text-2xl">P2P File Transfer</h1>
    <div class="flex gap-4 flex-col justify-center items-center">
      <div class="flex gap-3">
        <Button onClick={createOffer} text="Create Peer Connection" />
        <Button onClick={createAnswer} text="Connect to Peer" />
        <Button onClick={addAnswer} text="Add remote to Peer" />
      </div>
      <div style={`color: ${connectionStatus ? "green" : "red"}`}>
        Connection Status: {connectionStatus ? "Connected" : "Disconnected"}
      </div>
      <div class="flex justify-center items-center flex-col gap-3">
        <div
          class="flex w-64 h-16 border-2 relative border-dashed rounded-md justify-center items-center"
        >
          <input
            class="border-2 rounded-md absolute w-full h-full opacity-0 cursor-pointer"
            type="file"
            on:change={handleFileChange}
          />
          {#if fileInfo.name}
            <span
              class="text-ellipsis overflow-hidden w-[70%] whitespace-nowrap"
              >{fileInfo.name} - {fileInfo.size} bytes</span
            >
          {:else}
            <span>Drag and drop file here</span>
          {/if}
        </div>
        <Button onClick={send} text="Send" />
      </div>
      <div class="flex justify-center items-center gap-2 flex-col">
        <span>{progress}%</span>
        <div class="w-64 h-2 bg-gray-200 rounded-md overflow-hidden">
          <div class="h-2 bg-blue-500" style="width: {progress}%"></div>
        </div>
      </div>
      <div>
        {#if progress === 100}
          <Button onClick={saveFile} text="Save File" />
          <Button onClick={reset} text="Reset" />
        {/if}
      </div>
      <div class="w-full flex justify-center items-center flex-col gap-3">
        <textarea
          class="border-2 rounded-md w-full h-32 p-2 bg-transparent"
          value={localsdp}
        ></textarea>
        <Button
          onClick={() => navigator.clipboard.writeText(localsdp)}
          text="Copy SDP"
        />
      </div>
    </div>
  </div>
</main>

<style>
</style>
