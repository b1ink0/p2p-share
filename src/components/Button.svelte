<script>
  export let text = "Click";
  export let onClick = () => {};
  export let disabled = false;
  export let type = "button";
  export let className = "";
</script>

<button class={`${className} py-1 px-3 rounded-md bg-[#ff4d62] hover:bg-[#ff8896] transition-all`} {type} on:click={onClick} {disabled}>
  {text}
</button>
