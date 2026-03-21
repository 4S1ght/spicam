<script lang="ts">

    import type { Snippet } from "svelte"

    interface Props {
        children: Snippet
        type?: 'button' | 'submit' | 'reset' | undefined | null
        onclick?: () => any
    }

    const props: Props = $props()


</script>

<button {...props}>{@render props.children()}</button>

<style lang='scss'>

    button {
        height: calc(2.25rem + 2px);
        padding: 0 1rem;
        margin : 0.25rem 0;
        border-radius: 0.5rem;
        border: none;
        background-color: var(--bg-secondary);
        color: var(--fg-bleak);
        font-size: 0.9rem;
        cursor: pointer;

        &:hover {
            background-color: var(--bg-select);
            color: var(--fg-primary);
        }
    }

</style>