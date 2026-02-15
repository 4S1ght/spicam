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
    voltage: number
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

    private integrationScript = path.join(dirname, '../../python/INA219.py')
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
            await ProcessUtils.delayedExit(100, 101)
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
            const child = cp.spawn('python3', ['-u', this.integrationScript], { stdio: ['ignore', 'pipe', 'pipe'] })

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

    /**
     * Format:
     * Load Voltage:   4.136 V
     * Current:        0.921 A
     * Power:          3.804 W
     * Percent:        94.7%
     */
    private outputReg = /^\s*(Load Voltage|Current|Power|Percent):\s*(-?\d+(?:\.\d+)?)\s*[AVW%]?/
    private debugCounter = 0
    private debugCycle = 300

    private processOutput(output: string) {

        const readout: Partial<BMSReadout> = {}

        for (const line of output.split('\n')) {

            const match = line.match(this.outputReg)
            if (!match) continue

            const [, label, valueString] = match
            const value = parseFloat(valueString!)

            switch (label) {
                case 'Load Voltage':
                    readout.voltage = value
                    break
                case 'Current':
                    readout.current = value
                    break
                case 'Power':
                    readout.power = value
                    break
                case 'Percent':
                    readout.charge = value
                    break
            }

        }
        
        // Emit only when all props are present.
        // Python scripts can print out messages inconsistently in multiple chunks.
        // Any partial or malformed chunks are therefore discarded here.
        if (
            readout.voltage != null &&
            readout.current != null &&
            readout.power != null &&
            readout.charge != null
        ) {
            this.emit('info', readout as BMSReadout)

            if (++this.debugCounter >= this.debugCycle) {
                this.debugCounter = 0
                this.ls.debug(`BMS Readout:`)
                this.ls.debug(`\tVoltage: ${readout.voltage}`)
                this.ls.debug(`\tCurrent: ${readout.current}`)
                this.ls.debug(`\tPower:   ${readout.power}`)
                this.ls.debug(`\tCharge:  ${readout.charge}`)
            }

        }

    }

}