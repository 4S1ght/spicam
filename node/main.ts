// Imports =============================================================================================================

import DependencyLoadContext from 'depload'

import ConfigService                         from './config/Config.service.ts'
import LoggingService, { type LoggingScope } from './logging/Logging.service.ts'
import DatabaseService                       from './db/Database.service.ts'

import I2CBMSService                         from './integrations/BMS.service.ts'
import CameraService                         from './integrations/Camera.service.ts'
import LightControlService                   from './integrations/LightControl.service.ts'
import HTTPService                           from './web/HTTPService.ts'

// App ================================================================================================================

const dl = new DependencyLoadContext()

dl.registerService(ConfigService)
dl.registerService(LoggingService)
dl.registerService(I2CBMSService)
dl.registerService(DatabaseService)
dl.registerService(CameraService)
dl.registerService(LightControlService)
dl.registerService(HTTPService)

let stopping = false

const stop = async () => {
    if (stopping) return
    stopping = true
    await dl.stop()
}

process.on('SIGTERM', stop)
process.on('SIGINT', stop)
process.on('exit', stop)

process.on('uncaughtException', async (error) => {

    let ls: LoggingScope | null = null
    // @ts-ignore
    try { ls = dl.instances.get('logging').getScope(import.meta.url) } catch {}

    if (ls) ls.crit('Shutting down due to uncaught exception:', error)
    else console.error('Shutting down due to uncaught exception:', error)

    await stop()
    process.exit(1)

})

dl.start()

// Info ================================================================================================================

// Exit codes:

// 0   - Success
// 1   - Uncaught exception

// 1xx - BMS service
// 101 - No SMBUS module
// 102 - Too many python script restarts

// 2xx - Camera
// 200 - No camera sensor found