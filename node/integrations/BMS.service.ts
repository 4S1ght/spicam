// Imports =============================================================================================================

import cp                       from 'node:child_process'
import url                      from 'node:url'
import path                     from 'node:path'
import EventEmitter             from 'node:events'

import PythonUtils              from '../utils/Python.ts'
import ProcessUtils             from '../utils/Process.ts'

import type LoggingService      from '../logging/Logging.service.ts'
import type { LoggingScope }    from '../logging/Logging.service.ts'
import type ConfigService       from '../config/Config.service.ts'


const dirname = path.dirname(url.fileURLToPath(import.meta.url))

// Types ===============================================================================================================

interface BMSReadout {
    voltage_psu: number
    voltage_shunt: number
    voltage_bus: number
    current: number
    power: number
    charge: number
}

type BMSEvent = 'info'

// Service =============================================================================================================

export default interface I2CBMSService extends EventEmitter {
    on(eventName: BMSEvent, listener: (...args: any[])   => void): this
    on(eventName: 'info',   listener: (info: BMSReadout) => void): this
}

export default class I2CBMSService extends EventEmitter {

    public static name = 'bms'
    public static deps = ['logging', 'config']

    private integrationScript = path.join(dirname, '../../python/INA219_PSU.py')
    private cp: cp.ChildProcess | null = null
    private stopped = false

    private logging: LoggingService
    private ls: LoggingScope
    private config: ConfigService

    private lastRestart = 0
    private restartCount = 0

    public constructor(deps: { logging: LoggingService, config: ConfigService }) {

        super()
        this.logging = deps.logging
        this.ls = this.logging.getScope(import.meta.url)
        this.config = deps.config

        process.on('SIGTERM', () => this.stop())
        process.on('SIGINT',  () => this.stop())
        process.on('exit',    () => this.stop())

    }

    public async initializer() {

        this.ls.info('Starting service...')

        if (!PythonUtils.isAvailable('smbus')) {
            this.ls.error('The "smbus" python module is not available. Aborting.')
            await ProcessUtils.delayedExit(1000, 101)
        }

        await this.start()

        this.ls.info('Service started.')

    }

    public async destructor() {
        this.ls.info('Stopping service...')
        await this.stop()
        this.ls.info('Service stopped.')
    }

    private async start() {

        if (!this.config.settings.bms.enabled) {
            this.ls.info('BMS integration is disabled. The service will stay idle.')
            return
        }

        if (!this.cp || typeof this.cp.exitCode === 'number') {

            this.ls.info('Starting BMS script...')
            this.stopped = false

            const child = cp.spawn('python3', [
                '-u', this.integrationScript,
                '--polling', '1', 
            ], { stdio: ['ignore', 'pipe', 'pipe'] })

            await new Promise<void>((resolve, reject) => {
                
                const onError = (error: Error) => { cleanup(); reject(error) }
                const onSpawn = () => { cleanup(); resolve() }
                const cleanup = () => this.cp?.removeAllListeners()

                child.once('error', onError)
                child.once('spawn', onSpawn)

            })

            child.stdout.setEncoding('utf-8')
            child.stdout.on('data', (data) => this.processOutput(data))
            child.stderr.on('data', (data) => console.log(data.toString()))

            child.once('exit', () => {
                if (this.stopped === false) this.restart()
            })

            this.cp = child

        }

    }

    private async stop() {

        this.stopped = true
        this.ls.info('Stopping BMS script...')

        await new Promise<Error | undefined>((resolve) => {
            if (this.cp &&  this.cp.exitCode === null) {
                this.cp.on('close', resolve)
                this.cp.on('error', resolve)
                this.cp.kill()
            }
        })

        this.cp = null
        this.ls.info('BMS script stopped.')

    }

    private async restart() {

        this.ls.info('Restarting BMS script...')

        const now = Date.now()
        this.lastRestart = now

        if (this.lastRestart + 300_000 > now) {
            this.restartCount++
            this.lastRestart = now
        }
        else {
            this.restartCount = 0
        }
        
        if (this.restartCount >= 5) {
            this.ls.error('Too many BMS script restarts. Aborting.')
            await ProcessUtils.delayedExit(100, 102)
        }

        await this.start()

    }

    private debugCounter = 0
    private debugCycle = 300

    private processOutput(output: string) {

        const info: BMSReadout = JSON.parse(output)
        this.emit('info', info)

        if (this.debugCounter++ >= this.debugCounter) {

            this.debugCounter = 0
            const debugInfo: string[] = ['BMS status |']
            
            debugInfo.push(`Voltage: ${info.voltage_bus}`)
            debugInfo.push(`Shunt Voltage: ${info.voltage_shunt}`)
            debugInfo.push(`PSU Voltage: ${info.voltage_psu}`)
            debugInfo.push(`Current: ${info.current}`)
            debugInfo.push(`Power: ${info.power}`)
            debugInfo.push(`Charge: ${info.charge}`)
            this.ls.info(debugInfo.join(' '))

        }

    }

}