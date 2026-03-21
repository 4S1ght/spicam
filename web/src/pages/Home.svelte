<script lang="ts">

    import { onDestroy, onMount } from "svelte";
    import Icon from "../common/Icon.svelte"
    import { size } from "../helpers"

    import globals from '../globals.svelte'
    const dict = globals.dict

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
    let intersectTrigger: HTMLDivElement
    let videoPlayer: HTMLDivElement

    const observer = new IntersectionObserver(
        ([e]) => videoPlayer.setAttribute('data-stuck', e.intersectionRatio < 1 ? 'true' : 'false'),
        { threshold: [1] }
    )
    
    function getTimeOfDay(date: Date) {
        const d = new Date(date)
        const hh = String(d.getHours()).padStart(2, '0')
        const mm = String(d.getMinutes()).padStart(2, '0')
        const ss = String(d.getSeconds()).padStart(2, '0')
        return `${hh}:${mm}:${ss}`
    }

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
                list: vids.sort((a, b) => b.date.getTime() - a.date.getTime())
            })
        )

        videoList = []
        setTimeout(() => {
            videoList = buckets.sort((a, b) => b.date.getTime() - a.date.getTime())
        }, 0)
    }

    const selectVideo = (video: Video) => {
        activeVideo = ''
        setTimeout(() => {
            activeVideo = video.name
        }, 100)
    }

    onMount(() => {
        fetchVideos()
        observer.observe(intersectTrigger)
    })

    onDestroy(() => {
        observer.disconnect()
    })


</script>

<div class="home">

        <div bind:this={intersectTrigger}></div>
        <div class="video" bind:this={videoPlayer}>
            <div class="content">
                {#if activeVideo}
                    <video src="/api/recordings/stream/{activeVideo}" controls={true} autoplay={true}></video>
                {:else}
                    <Icon i="play-video-2"/>
                {/if}
            </div>
            <div class="controls">
                <button onclick={fetchVideos}>
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
        </div>

        <div class="list">
            <div class="row-desc">
                <div class="date">{dict['home.recorded_on']}</div>
                <div class="size">{dict['home.size']}</div>
            </div>

            <div class="content-table">

                {#each videoList as bucket}

                    <div class="table-section">
                        <p>{bucket.date.toLocaleDateString('en-GB').replace(/\//g, '-')}</p>
                        <div class="line"></div>
                    </div>

                    {#each bucket.list as video}
                        <div class="row" onclick={() => selectVideo(video)} data-selected="{video.name === activeVideo}">
                            <div class="date">{getTimeOfDay(video.date)}</div>
                            <div class="size">{size(video.size)}</div>
                        </div>
                    {/each}

                {/each}

            </div>
        </div>

</div>

<style lang="scss">

    .home {
        margin-top: 1.5rem;
        margin-bottom: 7rem;

        .video {
            width: clamp(200px, 85vw, 1000px);
            height: calc(clamp(200px, 50vw, 600px) + 3rem);
            background-color: black;
            margin: 0 auto;
            position: sticky;
            top: 0;
            border-radius: 1rem;
            transition: 0.15s;
            overflow: hidden;

            .content {
                width: clamp(200px, 85vw, 1000px);
                height: clamp(200px, 50vw, 600px);
                display: flex;
                justify-content: center;
                align-items: center;
                margin: 0 auto;

                video {
                    width: clamp(200px, 85vw, 1000px);
                    height: clamp(200px, 50vw, 600px);
                    transition: 0.15s;
                }

                :global(svg) {
                    width: clamp(2rem, 10vw, 4rem);
                    fill: var(--fg-bleak);
                }

            }

            &:global([data-stuck="true"]) {
                width: 100vw;
                border-radius: 0;
                // background-color: var(--bg-primary);
                box-shadow: 0 0 .5rem var(--fg-shadow);

                .content {
                    width: 100%;
                }

                video {
                    border-bottom-left-radius: 0.5rem;
                    border-bottom-right-radius: 0.5rem;
                }
            }

            .controls {
                width: clamp(200px, 85vw, 1000px);
                height: 3rem;
                margin: 0 auto;
                display: flex;
                align-items: center;
                
                button {
                    height: 2rem;
                    width: 2rem;
                    margin: 0 0 0 0.5rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: none;
                    border-radius: 0.4rem;
                    background-color: transparent;
                    cursor: pointer;
                    &:hover {
                        background-color: var(--bg-select);
                    }
                }

                :global(svg) {
                    width: 1.5rem;
                    margin: auto auto;
                    fill: var(--fg-primary);
                }

            }


        }

        .list {
            width: clamp(200px, 85vw, 1000px);
            margin: 3rem auto;

            .table-section {
                display: grid;
                grid-template-columns: max-content 1fr;
                align-items: center;
                gap: 1rem;
                margin: 0 0.5rem;

                p {
                    color: var(--fg-secondary);
                }

                .line {
                    height: 1px;
                    background-color: var(--fg-border);
                }
            }

            .row-desc {
                display: flex;
                justify-content: space-between;
                padding: 0.25rem 0.5rem;
                border-radius: 0.5rem;
                margin-bottom: 0.75rem;

                * {
                    color: var(--fg-secondary);
                }
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

                .size {
                    color: var(--fg-secondary);
                }
            }


            .row[data-selected="true"] {
                background-color: var(--bg-select);
            }
        }

    }

</style>