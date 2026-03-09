<script lang="ts">

    import globals from '../globals.svelte'

    let status = $state('')
    let statusCount = $state(0)

    async function login(e: SubmitEvent) {
        try {

            e.preventDefault()

            const username = (e.target as HTMLFormElement).username.value
            const password = (e.target as HTMLFormElement).password.value

            const response = await fetch('/api/session/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            })

            if (response.status === 200) {
                globals.loggedIn = true
                status = 'Logged in.'
            }
            else {
                if (response.statusText === status) statusCount++
                status = response.statusText
            }
            
        } 
        catch (error) {
            
        }
    }

</script>

<div class="login">
    <form onsubmit={login}>
        <h1>Spicam</h1>
        <p class="subtitle">Login to the spicam dashboard.</p>
        <label for="username">Username</label>
        <input type="text" name="username" />
        <label for="password">Password</label>
        <input type="password" name="password" />
        <button type="submit">Login</button>
        {#if status} 
            <p class="status">{status} {statusCount > 0 ? `(${statusCount})` : ''}</p>
        {/if}
    </form>
</div>

<style>

    .login {
        height: 100vh;
        width: 100%;
        display: flex;
        justify-content: center;
        /* align-items: center; */

        form {
            margin-top: 15vh;
            width: clamp(15rem, 75%, 20rem);
        }

        h1 {
            font-size: 1.5rem;
            margin: 0;
            color: var(--fg-bleak);
        }

        p.subtitle {
            margin: 0.5rem 0 2rem 0;
            color: var(--fg-thin);
        }

        label {
            display: block;
            background-color: var(--bg-primary);
            margin-left: 0.75rem;
            padding: 0 0.25rem;
            font-size: 0.85rem;
            color: var(--fg-bleak);
            transform: translateY(52%);
            width: min-content;
        }

        input {
            border: solid 1px var(--fg-border);
            border-radius: 0.5rem;
            padding: 0.75rem 1rem;
            margin-bottom: 0.5rem;
            display: block;
            width: calc(100% - 2rem - 2px);
        }

        button {
            border: solid 1px var(--fg-border);
            border-radius: 0.5rem;
            border-width: 2px 2px 6px 2px;
            padding: 0.75rem 1rem;
            margin: 2.5rem 0 1rem 0;
            display: block;
            width: 100%;
            cursor: pointer;
        }

        .status {
            text-align: center;
            color: var(--fg-bleak);
        }

    }

</style>