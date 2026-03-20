<script lang="ts">

    import Icon from "../common/Icon.svelte"

    let playStream = $state(false)

</script>

<div class="live-preview">
    <div class="stream-content">
        {#if playStream}
            <img src="some-blob"/>
        {:else}
            <Icon i="play-video-2"/>
        {/if}
    </div>
    <div class="controls">
        <button>Start preview</button>
    </div>
</div>

<style lang="scss">

    .live-preview {
        width: clamp(200px, 85vw, 1000px);
        margin: 2rem auto 10rem auto;

        .stream-content {
            width: clamp(200px, 85vw, 1000px);
            height: clamp(200px, 50vw, 600px);
            background-color: black;
            border-radius: 1rem;
            display: flex;
            justify-content: center;
            align-items: center;

            :global(svg) {
                width: clamp(2rem, 10vw, 4rem);
                fill: var(--fg-bleak);
            }
        }

        .controls {
            width: clamp(200px, 85vw, 1000px);
            display: flex;
            justify-content: center;
            gap: 1rem;
            margin-top: 2rem;

            button {
                background-color: var(--bg-secondary);
                color: var(--fg-secondary);
                border: none;
                padding: 0.5rem 1rem;
                border-radius: 0.5rem;
                cursor: pointer;

                &:hover {
                    background-color: var(--bg-select);
                    color: var(--fg-primary);
                }
            }
        }

    }

</style>