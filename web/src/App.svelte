<script lang="ts">

    import { Router } from "@mateothegreat/svelte5-router"

    import globals from './globals.svelte'

    import Login from "./pages/Login.svelte"
    import Home from './pages/Home.svelte'

</script>

<main>
    {#if !globals.loggedIn}
        <Login/>
    {:else}
        <Router routes={[
            {
                component: Home
            }
        ]}/>
    {/if}
</main>

<style>

</style>