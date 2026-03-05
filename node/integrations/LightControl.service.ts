// Imports =============================================================================================================

import cp                       from 'node:child_process'
import path                     from 'node:path'
import url                      from 'node:url'
import EventEmitter             from 'node:events'

import type LoggingService      from "../logging/Logging.service.ts"
import type DatabaseService     from "../db/Database.service.ts"
import type { LoggingScope }    from "../logging/Logging.service.ts"

const dirname = path.dirname(url.fileURLToPath(import.meta.url))

// Types ===============================================================================================================

// Service =============================================================================================================

interface LightControlService {
    on(event: 'light-level', listener: (level: 'day' | 'night') => void): this
}
class LightConftrolService extends EventEmitter {

    public static name = 'light_control'
    public static deps = ['logging', 'db']

    private db: DatabaseService
    private ls: LoggingScope

    public integrationScript = path.join(dirname, '../../python/LM393_LED_Controls.py')
    public lightEnvironment: 'day' | 'night' = 'day'

    constructor(deps: { logging: LoggingService, db: DatabaseService }) {
        super()
        this.db = deps.db
        this.ls = deps.logging.getScope(import.meta.url)
    }

    public async initializer() {
        this.ls.info('Starting lighting control service...')
        await this.start()
        this.ls.info('Lighting control service started.')
    }

    public async destructor() {
        this.ls.info('Stopping lighting control service...')
        await this.stop() 
        this.ls.info('Lighting control service stopped.')
    }

    private lightManageProcess: cp.ChildProcess | null = null

    private async start() {

        this.ls.info('Starting lighting control script...')

        const stdinPolling = await this.db.getSetting('led_controls_stdin_polling') as string
        const lightPolling = await this.db.getSetting('led_controls_light_polling') as string
        const threshold    = await this.db.getSetting('light_sensor_threshold')     as string
        const window       = await this.db.getSetting('light_sensor_window')        as string

        const child = this.lightManageProcess = cp.spawn('python3', [
            '-u', this.integrationScript,
            '--stdin-polling', stdinPolling,
            '--light-polling', lightPolling,
            '--light-sensor-threshold', threshold,
            '--light-sensor-window', window
        ], { stdio: 'pipe' })

        child.stdout?.on('data', data => this.handleMessage(data))
        child.stderr?.on('data', data => this.ls.error(data.toString('utf-8')))

        await new Promise<void>((resolve, reject) => {
            let done = false
            child.on('spawn', () => { done = true; resolve() })
            child.on('error', err => !done && reject(err))
        })

        this.ls.info('Lighting control script started.')
    }

    private async stop() {
        this.ls.info('Stopping lighting control script...')
        await new Promise<void>((resolve, reject) => {
            const cp = this.lightManageProcess
            if (cp && cp.exitCode === null && cp.killed === false) {
                cp.on('close', () => resolve())
                cp.on('error', () => reject())
                cp.kill('SIGTERM')
            }
            else resolve()
        })
        this.ls.info('Lighting control script stopped.')
    }

    // Message handling ------------------------------------------------------------------------------------------------

    private async handleMessage(data: Buffer) {

        const string = data.toString('utf-8').trim()
        const [message, ...args] = string.split(':')

        // console.log(string)

        switch (message) {
            case 'light_level':
                const level = parseInt(args[0]!)
                if (!isNaN(level)) {
                    const lightEnv = level === 1 ? 'night' : 'day'
                    if (lightEnv !== this.lightEnvironment) {
                        this.lightEnvironment = lightEnv
                        this.emit('light-level', this.lightEnvironment)
                        this.ls.debug(`Light environment changed to "${this.lightEnvironment}".`)
                    }
                }
                break
        }

    }

}

export default LightConftrolService