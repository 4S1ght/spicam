// Imports =============================================================================================================

import DependencyLoadContext from 'depload'

import ConfigService        from './config/Config.service.ts'
import LoggingService       from './logging/Logging.service.ts'
import DatabaseService      from './db/Database.service.ts'

import I2CBMSService        from './integrations/BMS.service.ts'
import CameraService        from './integrations/Camera.service.ts'
import LightConftrolService from './integrations/LightControl.service.ts'

// App ================================================================================================================

const dl = new DependencyLoadContext()

dl.registerService(ConfigService)
dl.registerService(LoggingService)
dl.registerService(I2CBMSService)
dl.registerService(DatabaseService)
dl.registerService(CameraService)
dl.registerService(LightConftrolService)

let stopping = false

const stop = async () => {
    if (stopping) return
    stopping = true
    await dl.stop()
}

process.on('SIGTERM', stop)
process.on('SIGINT', stop)

dl.start()

// Info ================================================================================================================

// Exit codes:

// 1xx - BMS service
// 101 - No SMBUS module
// 102 - Too many python script restarts

// 2xx - Camera
// 200 - No camera sensor found