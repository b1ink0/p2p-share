<script lang="ts">
  import { onMount } from "svelte";
  import Button from "./components/Button.svelte";
  import { addAnswer, createAnswer, createOffer, createPeerConnection, receive, send } from "./lib/webrtc";

  onMount(() => {
    createPeerConnection();
  });
</script>

<main class="flex flex-col justify-center items-center">
  <h1>P2P File Transfer</h1>
  <div class="flex gap-2">
    <Button onClick={createOffer} text="Create Peer Connection" />
    <Button onClick={createAnswer} text="Connect to Peer" />
    <Button onClick={addAnswer} text="Add remote to Peer" />
    <Button onClick={send} text="Send" />
    <Button onClick={receive} text="Receive" />

  </div>
</main>

<style>
</style>
