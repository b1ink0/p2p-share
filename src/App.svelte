<script lang="ts">
  import { onMount } from "svelte";
  import {
    file,
    status,
    sdp,
    currentId,
    receiveId,
    manualMode,
  } from "./store/store";
  import Button from "./components/Button.svelte";
  import {
    addAnswer,
    createAnswer,
    createOffer,
    reset,
    saveFile,
    send,
    connect,
    receive,
    createPeerConnection,
  } from "./lib/webrtc";

  let localManualMode = false;
  manualMode.subscribe((value) => {
    localManualMode = value;
    if (!value) {
      createPeerConnection();
    }
  });

  const handleToggleManualMode = () => {
    manualMode.set(!localManualMode);
  };

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

  let id = "";
  currentId.subscribe((value) => {
    id = value;
  });

  let localReceiveId = "";
  const handleChangeReceiveId = (e: any) => {
    localReceiveId = e.target.value;
    receiveId.set(e.target.value);
  };

</script>

<main class="flex flex-col justify-center items-center w-full">
  <div
    class="w-fit border-2 p-4 m-10 rounded-md gap-4 flex justify-center items-center flex-col"
  >
    <h1 class="text-2xl font-medium">P2P File Transfer</h1>
    <div class="flex gap-4 flex-col justify-center items-center">
      {#if localManualMode}
        <div class="flex gap-3">
          <Button onClick={() => createOffer()} text="Create Peer Connection" />
          <Button onClick={() => createAnswer()} text="Connect to Peer" />
          <Button onClick={() => addAnswer()} text="Add remote to Peer" />
        </div>
      {/if}
      <div style={`color: ${connectionStatus ? "green" : "red"}`}>
        Connection Status: {connectionStatus ? "Connected" : "Disconnected"}
      </div>
      {#if id !== ""}
        <div class="flex justify-center items-center gap-3">
          Share ID : {id}
        </div>
      {/if}
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
        {#if connectionStatus}
          <Button onClick={send} text="Send" />
        {:else}
          <Button onClick={connect} text="Connect" />
        {/if}
      </div>

      {#if progress !== 0}
        <span class="block h-[2px] w-full bg-white"></span>
        <div class="flex justify-center items-center gap-2 flex-col">
          <span>{progress}%</span>
          <div class="w-64 h-2 bg-gray-200 rounded-md overflow-hidden">
            <div class="h-2 bg-blue-500" style="width: {progress}%"></div>
          </div>
        </div>
      {/if}
      {#if progress === 100}
        <div>
          <Button onClick={saveFile} text="Save File" />
          <Button onClick={reset} text="Reset" />
        </div>
      {/if}
      <div class="flex gap-3 justify-center items-center w-full">
        <span class="block h-[2px] w-full bg-white"></span>
        <span>or</span>
        <span class="block h-[2px] w-full bg-white"></span>
      </div>
      <div class="flex gap-4">
        <input
          class="bg-transparent border-2 px-2 rounded-md w-52"
          type="text"
          placeholder="Enter ID"
          value={localReceiveId}
          on:input={handleChangeReceiveId}
        />
        <Button onClick={receive} text="Receive" />
      </div>
      {#if localManualMode}
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
      {/if}
    </div>
    <span class="block h-[2px] w-full bg-white mt-3"></span>
    <div class="flex gap-4">
      <Button onClick={handleToggleManualMode} text="Toggle Manual Mode" />
    </div>
  </div>
</main>

<style>
</style>
