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

    interface VideoBucket {
        date: Date
        list: Video[]
    }

    let activeVideo = $state('')
    let videoList: VideoBucket[] = $state([])

    const fetchVideos = async () => {

        const response = await fetch('/api/recordings/list')
        const data = await response.json() as any[]

        const videos = data.map((v: any) => ({
            name: v.name,
            size: v.size,
            date: new Date(v.date)
        }))

        const map = new Map<string, Video[]>()

        for (const v of videos) {
            const key = v.date.toISOString().split('T')[0]
            if (!map.has(key)) map.set(key, [])
            map.get(key)!.push(v)
        }
        
        const buckets: VideoBucket[] = Array.from(map.entries()).map(
            ([key, vids]) => ({
                date: new Date(key),
                list: vids.sort((a, b) => a.date.getTime() - b.date.getTime()),
            })
        )

        videoList = []
        setTimeout(() => {
            videoList = buckets.sort((a, b) => a.date.getTime() - b.date.getTime())
        }, 0)
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
            {#if activeVideo} 
                <a href="/api/recordings/stream/{activeVideo}" download>
                    <button>
                        <Icon i="download"/>
                    </button>
                </a>
            {/if}
        </div>

        <div class="list">
            <div class="row-desc">
                <div class="date">Recorded on</div>
                <div class="size">Size</div>
            </div>

            <div class="content-table">

                {#each videoList as bucket}

                    <div class="table-section">
                        <p>{bucket.date.toLocaleDateString('en-GB').replace(/\//g, '-')}</p>
                        <div class="line"></div>
                    </div>

                    {#each bucket.list as video}
                        <div class="row" on:click={() => selectVideo(video)} data-selected="{video.name === activeVideo}">
                            <div class="date">{video.date.toLocaleString()}</div>
                            <div class="size">{size(video.size)}</div>
                        </div>
                    {/each}

                {/each}


            </div>
        </div>

    </Content>
</div>

<style lang="css">

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
            width: clamp(200px, 85vw, 1000px);
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

        .list {
            width: clamp(200px, 85vw, 1000px);
            margin: 1rem auto;

            .table-section {
                display: grid;
                grid-template-columns: max-content 1fr;
                align-items: center;
                gap: 1rem;

                .line {
                    height: 1px;
                    background-color: var(--fg-thin);
                }
            }

            .row-desc {
                display: flex;
                justify-content: space-between;
                padding: 0.25rem 0;
                border-radius: 0.5rem;
                margin-bottom: 0.75rem;
            }

            .row {
                display: flex;
                justify-content: space-between;
                padding: 0.25rem 0.5rem;
                border-radius: 0.5rem;
                cursor: pointer;

                &:nth-child(even) {
                    background-color: var(--bg-secondary)
                }
                &:hover {
                    background-color: var(--bg-select);
                }
            }


            .row[data-selected="true"] {
                background-color: var(--bg-select);
            }
        }


/* 
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
                        
        } */

    }

</style>