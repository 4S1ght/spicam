<script lang="ts">

    import { onMount } from "svelte";
    import Content from "../common/Content.svelte"
    import Icon from "../common/Icon.svelte"
    import { size } from "../lhelpers"

    interface Video {
        name: string
        size: number
        date: Date
    }

    let activeVideo = $state('')
    let videos = $state([] as Video[])

    const fetchVideos = async () => {
        const response = await fetch('/api/recordings/list')
        const data = await response.json() as any[]
        videos = []
        setTimeout(() => {
            videos = data.map((v: any) => ({
                name: v.name,
                size: v.size,
                date: new Date(v.date)
            }))
        }, 100)
        
    }

    const selectVideo = (video: Video) => {
        activeVideo = ''
        window.scrollTo({ top: 0, behavior: 'smooth' })
        setTimeout(() => {
            activeVideo = video.name
        }, 100)
    }

    onMount(fetchVideos)


</script>

<div class="home">
    <Content width="1200px" class="menu"> 

        <div class="video">
            {#if activeVideo}
                <video src="/api/recordings/stream/{activeVideo}" controls={true} autoplay={true}></video>
            {:else}
                <Icon i="play-video-2"/>
            {/if}
        </div>

        <div class="controls">
            <button on:click={fetchVideos}>
                <Icon i="refresh"/>
            </button>
        </div>

        <table>
            <thead>
                <tr>
                    <th>File name</th>
                    <th>Size</th>
                    <th>Recorded on</th>
                </tr>
            </thead>
            <tbody>
                {#each videos as video}
                    <tr on:click={() => selectVideo(video)}>
                        <td>{video.name}</td>
                        <td>{size(video.size)}</td>
                        <td>{video.date.toLocaleString()}</td>
                    </tr>
                {/each}
            </tbody>
        </table>

    </Content>
</div>

<style>

    .home {

        margin-top: 1.5rem;

        .video {
            width: clamp(200px, 85vw, 1000px);
            height: clamp(200px, 50vw, 600px);
            background-color: var(--bg-secondary);
            border-radius: 1.5rem;
            display: flex;
            justify-content: center;
            align-items: center;
            margin: 0 auto;
            overflow: hidden;

            video {
                width: clamp(200px, 85vw, 1000px);
                height: clamp(200px, 50vw, 600px);
            }
        }

        .video :global(svg) {
            width: clamp(2rem, 10vw, 4rem);
            fill: var(--fg-bleak);
        }

        .controls {
            width: clamp(200px, 85, 1000px);
            height: 3rem;
            margin: 1rem auto;
            display: flex;
            align-items: center;

            button {
                background-color: transparent;
                border: none;
            }

            :global(svg) {
                width: 1.75rem;
                fill: var(--fg-bleak);
                padding: 0.25rem;
                cursor: pointer;
                border-radius: 0.5rem;
                background-color: var(--bg-secondary);
                &:hover {
                    background-color: var(--bg-select);
                }
            }
        }

        table {
            border-collapse: collapse;
            width: 100%;
            margin: 1rem auto;

            @media screen and (max-width: 768px) {
                font-size: 0.8rem;
            }

            thead tr th {
                text-align: left;
                padding-bottom: 0.75em;
                color: var(--fg-bleak); 
            }

            tbody tr:nth-child(even) td {
                background-color: var(--bg-secondary);
                margin: 0.5rem 0;
            }

            tbody tr td:first-child {
                border-top-left-radius: 0.5em;
                border-bottom-left-radius: 0.5em;
            }

            tbody tr td:last-child {
                border-top-right-radius: 0.5em;
                border-bottom-right-radius: 0.5em;
            }

            tbody tr {
                cursor: pointer;
                &:hover td {
                    background-color: var(--bg-select);
                }
            }
                        
        }

    }

</style>