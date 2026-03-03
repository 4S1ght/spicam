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

const dirname = path.dirname(url.fileURLToPath(import.meta.url))

// Types ===============================================================================================================

type JPEG = Awaited<ReturnType<typeof Jimp.read>>

// Service =============================================================================================================

export default class CameraService {

    private stopped = false

    public static name = 'camera'
    public static deps = ['logging', 'db']

    private db: DatabaseService
    private ls: LoggingScope

    constructor(deps: { logging: LoggingService, db: DatabaseService }) {
        this.db = deps.db
        this.ls = deps.logging.getScope(import.meta.url)
    }

    public async initializer() {
        this.ls.info('Starting camera service...')
        await this.startMotionDetect()
        this.ls.info('Camera service started.')
    }

    public async destructor() {
        if (this.stopped === true) return
        this.stopped = true
        this.ls.info('Stopping camera service...')
        await this.stopMotionDetect()
        await this.stopRecordingClip()
        this.ls.info('Camera service stopped.')
    }

    // Motion detection ================================================================================================

    private motionDetectProcess: cp.ChildProcess | null = null
    private shouldProcessMotion = false

    private async startMotionDetect() {

        this.shouldProcessMotion = true

        const frameWidth  = await this.db.getSetting('motion_detect_frame_width')  as string
        const frameHeight = await this.db.getSetting('motion_detect_frame_height') as string
        const framerate   = await this.db.getSetting('motion_detect_frame_rate')   as string
        const minDiff     = await this.db.getSetting('motion_detect_min_diff')     as string
        const bufferSize  = await this.db.getSetting('motion_detect_framebuf')     as string

        this.ls.info(`Motion detect frame width:  ${frameWidth}`)
        this.ls.info(`Motion detect frame height: ${frameHeight}`)
        this.ls.info(`Motion detect framerate:    ${framerate}`)
        this.ls.info(`Motion detect min diff:     ${minDiff}`)

        this.fb = new FrameBuffer(parseInt(bufferSize))

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

        child.stdout.on('data', (data: Buffer) => this.processMotionStream(data, parseFloat(minDiff)))
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

    private async processMotionStream(data: Buffer, minDiff: number) {

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

            this.fb.reset()
            this.fb.write(rest)
            
            this.previousFrame = this.currentFrame
            this.currentFrame = await Jimp.read(frame)

            if (this.previousFrame) {
                const diff = distance(this.previousFrame, this.currentFrame)
                if (diff >= minDiff) {
                    this.ls.info(`Motion detected. Confidence: ${diff.toFixed(3)}, threshold: ${minDiff}`)
                    this.recordClip()
                }
            }

        }
    
    }

    // Debug output ================================================================================================
    
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

    // Recording =======================================================================================================

    private recordingProcess: cp.ChildProcess | null = null

    private async recordClip() {

        await this.stopMotionDetect()

        const width      = await this.db.getSetting('recording_frame_width')      as string
        const height     = await this.db.getSetting('recording_frame_height')     as string
        const framerate  = await this.db.getSetting('recording_frame_rate')       as string
        const duration   = await this.db.getSetting('recording_duration_seconds') as string
        const bitrate    = await this.db.getSetting('recording_bitrate')          as string

        this.ls.info(`Starting a ${duration}s ${height}p/${width}p ${framerate}fps recording.`)

        const fileDir = path.join(dirname, '../../etc/recordings')
        const filename = new Date().toISOString() + '.mp4'

        await fs.mkdir(fileDir, { recursive: true })

        const child = this.recordingProcess = cp.spawn('rpicam-vid', [
            '-t',           String(parseInt(duration) * 1000),
            '--codec',      'h264', 
            '--width',      width, 
            '--height',     height,
            '--framerate',  framerate,
            '--bitrate',    bitrate,
            '-o',           path.join(fileDir, filename)
        ])

        const logs = [
            '',
            '\n',
            '\t'
        ]

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

    // Live video preview ==============================================================================================

}