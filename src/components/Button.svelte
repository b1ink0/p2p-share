<script>
  export let text = "Click";
  export let onClick = () => {};
  export let disabled = false;
  export let type = "button";
  export let className = "";
</script>

<button class={`${className} border-2 px-2 rounded-md `} {type} on:click={onClick} {disabled}>
  {text}
</button>
