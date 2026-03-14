<script lang="ts">

    import { goto, Router, type RouteResult } from "@mateothegreat/svelte5-router"

    import globals from './globals.svelte'

    import Login from "./pages/Login.svelte"
    import Home from './pages/Home.svelte'
    import Navbar from "./common/Navbar.svelte"
    import Settings from "./pages/Settings.svelte"
    import LivePreview from "./pages/LivePreview.svelte"

</script>

<main>
    {#if !globals.loggedIn}
        <Login/>
    {:else}
        <Navbar/>
        <Router 
            hooks={{
                post: [
                    (x: RouteResult) => { 
                        globals.route = x.result.path.original
                    }
                ]
            }}
            routes={[
                {
                    component: Home
                },
                {
                    path: '/home',
                    component: Home
                },
                {
                    path: '/settings',
                    component: Settings
                },
                {
                    path: '/live-preview',
                    component: LivePreview
                }
            ]}
        />
    {/if}
</main>

<style>

</style>