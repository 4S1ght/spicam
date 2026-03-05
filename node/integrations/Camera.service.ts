// Imports =============================================================================================================

import path                  from 'node:path'
import url                   from 'node:url'
import cp                    from 'node:child_process'
import fs                    from 'node:fs/promises'
import { Jimp, distance }    from 'jimp'

import type DatabaseService  from "../db/Database.service.ts"
import type { LoggingScope } from "../logging/Logging.service.ts"
import type LoggingService   from "../logging/Logging.service.ts"
import { FrameBuffer }       from '../utils/Buffers.ts'
import type LightConftrolService from './LightControl.service.ts'

const dirname = path.dirname(url.fileURLToPath(import.meta.url))

// Types ===============================================================================================================

type JPEG = Awaited<ReturnType<typeof Jimp.read>>

// Service =============================================================================================================

export default class CameraService {

    private stopped = false

    public static name = 'camera'
    public static deps = ['logging', 'db', 'light_control']

    private lc: LightConftrolService
    private db: DatabaseService
    private ls: LoggingScope
    private lcu: NodeJS.Timeout | null = null

    private outDir = path.join(dirname, '../../etc/recordings')

    constructor(deps: { logging: LoggingService, db: DatabaseService, light_control: LightConftrolService }) {
        this.lc = deps.light_control
        this.db = deps.db
        this.ls = deps.logging.getScope(import.meta.url)
    }

    public async initializer() {
        this.ls.info('Starting camera service...')
        await fs.mkdir(this.outDir, { recursive: true })
        await this.startMotionDetect()
        this.startLifecycleUpkeep()
        this.ls.info('Camera service started.')
    }

    public async destructor() {
        if (this.stopped === true) return
        this.stopped = true
        this.ls.info('Stopping camera service...')
        await this.stopMotionDetect()
        await this.stopRecordingClip()
        this.lcu?.close()
        this.ls.info('Camera service stopped.')
    }

    // Motion detection ------------------------------------------------------------------------------------------------

    private motionDetectProcess: cp.ChildProcess | null = null
    private shouldProcessMotion = false

    private async startMotionDetect() {

        const mdp = this.motionDetectProcess
        if (mdp && mdp.exitCode === null && mdp.killed === false) {
            mdp.kill('SIGTERM')
            await new Promise((resolve) => {
                mdp.on('close', resolve)
                mdp.on('error', resolve)
            })
        }

        this.shouldProcessMotion = true

        const frameWidth  = await this.db.getSetting('motion_detect_frame_width')  as string
        const frameHeight = await this.db.getSetting('motion_detect_frame_height') as string
        const framerate   = await this.db.getSetting('motion_detect_frame_rate')   as string
        const minDiff     = await this.db.getSetting('motion_detect_min_diff')     as string
        const maxDiff     = await this.db.getSetting('motion_detect_max_diff')     as string
        const bufferSize  = await this.db.getSetting('motion_detect_framebuf')     as string

        this.ls.info(`Motion detect running at ${frameWidth}x${frameHeight}p/${framerate}fps, hamming diff: ${minDiff}-${maxDiff}, frame buffer: ${(parseInt(bufferSize)/1000).toFixed(1)}kB.`)

        this.fb = new FrameBuffer(parseInt(bufferSize))

        // These need a reset each start of motion detection, or else a "revious frame" from minutes ago
        // might be compared with a "current frame" and their difference may false trigger in a loop.
        this.previousFrame = null
        this.currentFrame = null

        const child = this.motionDetectProcess = cp.spawn('rpicam-vid', [
            '-t',           '0',
            '--codec',      'mjpeg', 
            '--width',      frameWidth, 
            '--height',     frameHeight,
            '--framerate',  framerate, 
            '-o',           '-'
        ], { stdio: ['ignore', 'pipe', 'pipe'] })

        await new Promise<void>((resolve, reject) => {
            
            const onError = (error: Error) => { cleanup(); reject(error) }
            const onSpawn = () => { cleanup(); resolve() }
            const cleanup = () => this.motionDetectProcess!.removeAllListeners()

            child.once('error', onError)
            child.once('spawn', onSpawn)
            
        })

        child.stdout.on('data', (data: Buffer) => this.processMotionStream(data, parseFloat(minDiff), parseFloat(maxDiff)))
        child.stderr.on('data', (data: Buffer) => this.processMotionDebug(data))

    }

    private async stopMotionDetect() {

        this.ls.info('Stopping motion detection...')

        this.shouldProcessMotion = false
        const cp = this.motionDetectProcess

        const result = await new Promise<Error | undefined>((resolve) => {
            if (cp && cp.exitCode === null && cp.killed === false) {
                cp.on('close', resolve)
                cp.on('error', resolve)
                cp.kill()
            }
            else resolve(undefined)
        })

        this.ls.info('Motion detection stopped.')
        return result

    }

    private declare fb: FrameBuffer

    private previousFrame: JPEG | null = null
    private currentFrame:  JPEG | null = null
    
    private SOI = Buffer.from([0xFF, 0xD8]) // Start of Image (SOI)    
    private EOI = Buffer.from([0xFF, 0xD9]) // End of Image (EOI)

    private markMissCounter = 0

    private async processMotionStream(data: Buffer, minDiff: number, maxDiff: number) {

        if (!this.shouldProcessMotion) return

        this.fb.write(data)

        const buffer = this.fb.readAll()
        const start  = buffer.indexOf(this.SOI)
        const end    = buffer.lastIndexOf(this.EOI)

        // start & end found
        if (start > -1 && end > -1) {

            const frameEnd = end + this.EOI.length
            const frame = Buffer.from(buffer.subarray(start, frameEnd))
            const rest = buffer.subarray(frameEnd)
            this.markMissCounter = 0

            this.fb.reset()
            this.fb.write(rest)
            
            this.previousFrame = this.currentFrame
            this.currentFrame = await Jimp.read(frame)

            if (this.previousFrame) {
                const diff = distance(this.previousFrame, this.currentFrame)
                if (diff >= minDiff && diff < maxDiff) {
                    this.ls.info(`Motion detected. Confidence: ${diff.toFixed(3)} in bounds ${minDiff}-${maxDiff}.`)
                    this.recordClip()
                }
            }

        }
        else {
            this.markMissCounter++
            if (this.markMissCounter === 50) {
                this.ls.warn('Motion detect stream: No SOI/EOI found in the stream and reached maximum allowed value. Resetting the motion detect settings to safe defaults.')
                await this.db.resetSetting('motion_detect_frame_width')
                await this.db.resetSetting('motion_detect_frame_height')
                await this.db.resetSetting('motion_detect_frame_rate')
                await this.db.resetSetting('motion_detect_min_diff')
                await this.db.resetSetting('motion_detect_max_diff')
                await this.db.resetSetting('motion_detect_framebuf')
                this.ls.warn('Settings reset successfully.')
                this.markMissCounter = 0
                await this.startMotionDetect()
            }
        }
    
    }

    // Debug output ----------------------------------------------------------------------------------------------------
    
    public missingCamera: boolean = false

    private errors = {
        camNotFound: 'no cameras available'
    }

    private processMotionDebug(data: Buffer) {

        const message = data.toString()

        // Check if camera is detected:
        if (message.includes(this.errors.camNotFound)) {
            this.ls.crit('Camera sensor not found. Aborting the startup.')
            this.ls.crit(data.toString())
            process.exit(200)
        }

    }

    // Recording -------------------------------------------------------------------------------------------------------

    private recordingProcess: cp.ChildProcess | null = null

    private async recordClip() {

        await this.stopMotionDetect()

        const width      = await this.db.getSetting('recording_frame_width')      as string
        const height     = await this.db.getSetting('recording_frame_height')     as string
        const framerate  = await this.db.getSetting('recording_frame_rate')       as string
        const duration   = await this.db.getSetting('recording_duration_seconds') as string
        const bitrate    = await this.db.getSetting('recording_bitrate')          as string

        const nv         = this.lc.lightEnvironment === 'night'
        const contrast   = await this.db.getSetting('night_vision_contrast')      as string
        const gain       = await this.db.getSetting('night_vision_gain')          as string

        this.ls.info(
            `Starting a recording at ${width}x${height}@${framerate}fps, ${Math.abs(parseInt(bitrate)/1_000_000)}Mbps for ${duration}s`
            + (nv ? ` Night vision active. Contrast: ${contrast}, gain: ${gain}.` : '')
        )

        const filename = new Date().toISOString() + '.mp4'

        const child = this.recordingProcess = cp.spawn('rpicam-vid', [
            '-t',           String(parseInt(duration) * 1000),
            '--codec',      'h264', 
            '--width',      width, 
            '--height',     height,
            '--framerate',  framerate,
            '--bitrate',    bitrate,
            '-o',           path.join(this.outDir, filename),
            ...(!nv ? [] : [
                '--saturation', '0',
                '--contrast',   contrast,
                '--analoggain', gain,
            ])
        ])

        // Pipe recording process output to debug, filtering out empty lines and tabs.
        child.stderr.on('data', (data: Buffer) => {
            const message = data.toString()
            const sample = message.substring(0, 15)
            if (!/#\d+/.test(sample) && data.length > 10) this.ls.debug(message)
        })

        child.on('error', (error: Error) => this.ls.error(error))
        child.on('close', (code) => {
            this.ls.info(`Recording "${filename}" finished.`)
            this.ls.info(`Recording process exited with code ${code}.`)
            if (!this.stopped) this.startMotionDetect()
        })

    }

    private async stopRecordingClip() {

        this.ls.info('Stopping recording...')

        const cp = this.recordingProcess

        const result = await new Promise<Error | undefined>((resolve) => {
            if (cp && cp.exitCode === null && cp.killed == false) {
                cp.on('close', resolve)
                cp.on('error', resolve)
                cp.kill('SIGTERM')
            }
            else resolve(undefined)
        })

        this.ls.info('Recording stopped.')
        return result

    }

    // Live video preview ----------------------------------------------------------------------------------------------

    private livePreviewProcess: cp.ChildProcess | null = null

    public async createLivePreview() {

        const md = this.motionDetectProcess!
        const rec = this.recordingProcess!

        let mdDead = md && (md.exitCode || md.killed)
        let recDead = rec && (rec.exitCode || rec.killed)

        if (!mdDead) await new Promise((resolve) => {
            md.once('exit', resolve)
            md.kill('SIGTERM')
        })

        if (!recDead) await new Promise((resolve) => {
            rec.once('exit', resolve)
            rec.kill('SIGTERM')
        })

        const width      = await this.db.getSetting('live_preview_frame_width')  as string
        const height     = await this.db.getSetting('live_preview_frame_height') as string
        const framerate  = await this.db.getSetting('live_preview_frame_rate')   as string
        const bitrate    = await this.db.getSetting('live_preview_bitrate')      as string

        const nv         = this.lc.lightEnvironment === 'night'
        const contrast   = await this.db.getSetting('night_vision_contrast')      as string
        const gain       = await this.db.getSetting('night_vision_gain')          as string

        this.ls.info(
            `Starting live preview at ${width}x${height}@${framerate}fps, ${Math.abs(parseInt(bitrate)/1_000_000)}Mbps.` 
            + (nv ? ` Night vision active. Contrast: ${contrast}, gain: ${gain}.` : '')
        )

        const child = this.livePreviewProcess = cp.spawn('rpicam-vid', [
            '-t',           '0',
            '--codec',      'h264', 
            '--width',      width, 
            '--height',     height,
            '--framerate',  framerate,
            '--bitrate',    bitrate,
            '-o',           '-',
            ...(!nv ? [] : [
                '--saturation', '0',
                '--contrast',   contrast,
                '--analoggain', gain,
            ])
        ], { stdio: ['ignore', 'pipe', 'pipe'] })

        child.stderr.on('data', (data: Buffer) => {
            const message = data.toString()
            const sample = message.substring(0, 15)
            if (!/#\d+/.test(sample) && data.length > 10) this.ls.debug(message)
        })

        child.on('error', (error: Error) => this.ls.error(error))
        child.on('close', (code) => {
            this.ls.info(`Live preview process exited with code ${code}.`)
            if (!this.stopped) this.startMotionDetect()
        })

        return child

    }

    // Lifecycle upkeep ------------------------------------------------------------------------------------------------
    
    private startLifecycleUpkeep() {
        this.lcu = setInterval(() => {

            const md = this.motionDetectProcess!
            const rec = this.recordingProcess!
            const lp = this.livePreviewProcess!

            let mdDead = md && (md.exitCode || md.killed)
            let recDead = rec && (rec.exitCode || rec.killed)
            let lpDead = lp && (lp.exitCode || lp.killed)

            if (mdDead && recDead && lpDead) {
                this.ls.warn('Both motion detect and recording processes are not running. Restarting motion detection due to a broken recording cycle.')
                this.startMotionDetect()
            }

        }, 30*1000)
    }

}