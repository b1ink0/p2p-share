<script>
  export let text = "Click";
  export let onClick = () => {};
  export let disabled = false;
  export let type = "button";
  export let className = "";
</script>

<button class={`${className} border-2 px-2 rounded-md bg-slate-600 hover:bg-slate-500 transition-all`} {type} on:click={onClick} {disabled}>
  {text}
</button>
