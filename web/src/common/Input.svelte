<script lang="ts">

    import type { HTMLInputTypeAttribute } from "svelte/elements";

    let { value = $bindable(''), ...props }: Props = $props();

    interface Props {
        value?: string
        placeholder?: string
        type?: HTMLInputTypeAttribute
    }

</script>

<input {...props} bind:value={value} class="input" />

<style>
    .input {
        padding: 0.5rem 0.75rem;
        margin : 0.25rem 0;
        border: 1px solid var(--fg-border);
        border-radius: 6px;
        font-size: 0.9rem;
        outline: none;
        background: transparent;
        transition: border-color 0.15s ease;
        height: 1.25rem;
    }

    .input:focus {
        border-color: var(--fg-secondary);
    }

    .input::placeholder {
        color: var(--fg-secondary);
    }
</style>
