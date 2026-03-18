<script lang="ts">

    import { route } from "@mateothegreat/svelte5-router"

    import globals from "../globals.svelte"
    import Icon from "./Icon.svelte"

</script>

<nav>
    <a href="/settings" use:route>
        <Icon i="cog" height="2rem" width="2rem" class={globals.route === '/settings' ? 'active' : ''} />
    </a>
    <a href="/home" use:route>
        <Icon i="home" height="2rem" width="2rem" class={globals.route === '/home' ? 'active' : ''} />
    </a>
    <a href="/live-preview" use:route>
        <Icon i="play-video" height="2rem" width="2rem" class={globals.route === '/live-preview' ? 'active' : ''} />
    </a>
</nav>

<style>
    
    nav {
        position: fixed;
        bottom: 0;
        left: 0;
        height: 4.5rem;
        width: 100%;
        background-color: var(--bg-primary);
        box-shadow: 0 0 1rem var(--fg-shadow);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 2rem;

        @media screen and (max-width: 768px) {
            height: 4rem
        }

        * {
            user-select: none;
        }

        :global(svg) {
            height: 2rem;
            width: 2rem;
            fill: var(--fg-bleak);
            &.active {
                fill: var(--fg-accent);
            }
        }

    }

</style>