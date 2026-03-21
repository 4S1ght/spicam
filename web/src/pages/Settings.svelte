<script lang="ts">

    import { onMount } from "svelte"

    import Button from "../common/Button.svelte"
    import Input from "../common/Input.svelte"
    import globals from "../globals.svelte"
    import * as dicts from '../dictionary'
    import type { Language } from "../dictionary"

    let dict = globals.dict

    let session_duration = $state('')

    let night_vision_contrast = $state('')
    let night_vision_gain = $state('')

    let motion_detect_frame_width = $state('')
    let motion_detect_frame_height = $state('')
    let motion_detect_frame_rate = $state('')
    let motion_detect_min_diff = $state('')
    let motion_detect_max_diff = $state('')

    let recording_frame_width = $state('')
    let recording_frame_height = $state('')
    let recording_frame_rate = $state('')
    let recording_duration_seconds = $state('')
    let recording_bitrate = $state('')

    let live_preview_frame_width = $state('')
    let live_preview_frame_height = $state('')
    let live_preview_frame_rate = $state('')
    let live_preview_bitrate = $state('')

    let led_controls_stdin_polling = $state('')
    let led_controls_light_polling = $state('')
    let light_sensor_threshold = $state('')
    let light_sensor_window = $state('')

    const updateSetting = async (key: string, value: string | number | boolean) => {

        const result = await fetch('/api/settings/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key, value })
        })

        if (result.status !== 200) alert(result.statusText)
        else alert(dict['settings.saved_successfully'])

    }


    let langSelect: HTMLSelectElement

    const updateLanguage = () => {
        localStorage.setItem('lang', langSelect.value)
        globals.lang = langSelect.value as Language
        globals.dict = dicts[globals.lang]
    }

    onMount(async () => {
        
        const response = await fetch('/api/settings/list')
        if (response.status !== 200) return alert(dict['settings.failed_to_load'])

        const settings = await response.json()

        session_duration = settings.session_duration

        night_vision_contrast = settings.night_vision_contrast
        night_vision_gain = settings.night_vision_gain

        motion_detect_frame_width = settings.motion_detect_frame_width
        motion_detect_frame_height = settings.motion_detect_frame_height
        motion_detect_frame_rate = settings.motion_detect_frame_rate
        motion_detect_min_diff = settings.motion_detect_min_diff
        motion_detect_max_diff = settings.motion_detect_max_diff

        recording_frame_width = settings.recording_frame_width
        recording_frame_height = settings.recording_frame_height
        recording_frame_rate = settings.recording_frame_rate
        recording_duration_seconds = settings.recording_duration_seconds
        recording_bitrate = settings.recording_bitrate

        live_preview_frame_width = settings.live_preview_frame_width
        live_preview_frame_height = settings.live_preview_frame_height
        live_preview_frame_rate = settings.live_preview_frame_rate
        live_preview_bitrate = settings.live_preview_bitrate

        led_controls_stdin_polling = settings.led_controls_stdin_polling
        led_controls_light_polling = settings.led_controls_light_polling
        light_sensor_threshold = settings.light_sensor_threshold
        light_sensor_window = settings.light_sensor_window

    })

</script>

<div class="settings">
    <h1 class="heading">{dict['settings.title']}</h1>
    <span>{dict['settings.warning']}</span>

    <!------------------------------------------------------------------------------------------------------->

    <div class="section">
        <h2>{dict['settings.account.heading']}</h2>
        <div></div>
    </div>

    <h3>{dict['settings.account.session_duration']}</h3>
    <Input bind:value={session_duration}/>
    <Button onclick={() => updateSetting('session_duration', session_duration)}>{dict['settings.save']}</Button>
    <span>{dict['settings.account.session_duration.desc']}</span>

    <!------------------------------------------------------------------------------------------------------->

    <div class="section">
        <h2>{dict['settings.recordings.heading']}</h2>
        <div></div>
    </div>

    <h3>{dict['settings.recordings.resolution']}</h3>
    <p>{dict['settings.recordings.resolution.desc']}</p>
    <Input bind:value={recording_frame_width}/>
    <Button onclick={() => updateSetting('recording_frame_width', recording_frame_width)}>{dict['settings.save']}</Button>
    <Input bind:value={recording_frame_height}/>
    <Button onclick={() => updateSetting('recording_frame_height', recording_frame_height)}>{dict['settings.save']}</Button>
    <span><b>{dict['settings.note']}</b> {dict['settings.recordings.resolution.note']}</span>

    <h3>{dict['settings.recordings.frame_rate']}</h3>
    <Input bind:value={recording_frame_rate}/>
    <Button onclick={() => updateSetting('recording_frame_rate', recording_frame_rate)}>{dict['settings.save']}</Button>
    <span>{dict['settings.recordings.frame_rate.desc']}</span>

    <h3>{dict['settings.recordings.duration']}</h3>
    <Input bind:value={recording_duration_seconds}/>
    <Button onclick={() => updateSetting('recording_duration_seconds', recording_duration_seconds)}>{dict['settings.save']}</Button>
    <span>{dict['settings.recordings.duration.desc']}</span>

    <h3>{dict['settings.recordings.bitrate']}</h3>
    <Input bind:value={recording_bitrate}/>
    <Button onclick={() => updateSetting('recording_bitrate', recording_bitrate)}>{dict['settings.save']}</Button>
    <span>{dict['settings.recordings.bitrate.desc']}</span>

    <h3>{dict['settings.recordings.night_vision']}</h3>
    <p>{dict['settings.recordings.night_vision.desc']}</p>

    <h4>{dict['settings.recordings.night_vision.contrast']}</h4>
    <Input bind:value={night_vision_contrast}/>
    <Button onclick={() => updateSetting('night_vision_contrast', night_vision_contrast)}>{dict['settings.save']}</Button>
    <span>{dict['settings.recordings.night_vision.contrast.desc']}</span>

    <h4>{dict['settings.recordings.night_vision.gain']}</h4>
    <Input bind:value={night_vision_gain}/>
    <Button onclick={() => updateSetting('night_vision_gain', night_vision_gain)}>{dict['settings.save']}</Button>
    <span>{dict['settings.recordings.night_vision.gain.desc']}</span>

    <!------------------------------------------------------------------------------------------------------->

    <div class="section">
        <h2>{dict['settings.motion.heading']}</h2>
        <div></div>
    </div>

    <h3>{dict['settings.motion.resolution']}</h3>
    <p>{dict['settings.motion.resolution.desc']}</p>
    <Input bind:value={motion_detect_frame_width}/>
    <Button onclick={() => updateSetting('motion_detect_frame_width', motion_detect_frame_width)}>{dict['settings.save']}</Button>

    <Input bind:value={motion_detect_frame_height}/>
    <Button onclick={() => updateSetting('motion_detect_frame_height', motion_detect_frame_height)}>{dict['settings.save']}</Button>
    <span><b>{dict['settings.note']}</b> {dict['settings.motion.resolution.note']}</span>

    <h3>{dict['settings.motion.frame_rate']}</h3>
    <Input bind:value={motion_detect_frame_rate}/>
    <Button onclick={() => updateSetting('motion_detect_frame_rate', motion_detect_frame_rate)}>{dict['settings.save']}</Button>
    <span>{dict['settings.motion.frame_rate.desc']}</span>

    <h3>{dict['settings.motion.frame_diff']}</h3>
    <Input bind:value={motion_detect_min_diff}/>
    <Button onclick={() => updateSetting('motion_detect_min_diff', motion_detect_min_diff)}>{dict['settings.save']}</Button>
    <Input bind:value={motion_detect_max_diff}/>
    <Button onclick={() => updateSetting('motion_detect_max_diff', motion_detect_max_diff)}>{dict['settings.save']}</Button>
    <span>
        {dict['settings.motion.frame_diff.desc']}
        <br><br>
        <b>{dict['settings.important']}</b> {dict['settings.motion.frame_diff.warning']}
    </span>

    <!------------------------------------------------------------------------------------------------------->

    <div class="section">
        <h2>{dict['settings.language.heading']}</h2>
        <div></div>
    </div>

    <select name="lang" oninput={updateLanguage} bind:this={langSelect} value={globals.lang}>
        <option value="english">English</option>
        <option value="polish">Polski</option>
    </select>

</div>

<style lang="scss">

    .settings {
        width: clamp(200px, 85vw, 1000px);
        margin: 2rem auto 10rem auto;

        .heading {
            font-weight: 600;
        }

        .section {
            display: grid;
            grid-template-columns: min-content 1fr;
            gap: 1rem;
            align-items: center;
            margin: 3rem 0 1rem 0;

            h2 {
                margin: 0;
                font-size: 1rem;
                font-weight: 500;
                color: var(--fg-secondary);
                text-wrap: nowrap;
            }

            div {
                height: 1px;
                width: 100%;
                background-color: var(--fg-border);
            }
        }

        h3 {
            font-size: 1rem;
            font-weight: 500;
            margin: 1rem 0 0.5rem 0;
        }
        h4 {
            font-size: 0.8rem;
            font-weight: 500;
            margin: 1.5rem 0 0.5rem 0;
        }
        span {
            font-size: 0.8rem;
            color: var(--fg-secondary);
            max-width: clamp(200px, 85vw, 800px);
            display: block;
            margin: 0.5rem 0 1.5rem 0;
        }
        p {
            font-size: 0.8rem;
            color: var(--fg-secondary);
            max-width: clamp(200px, 85vw, 800px);
            display: block;
            margin: 0 0 1rem 0;
        }

    }

</style>