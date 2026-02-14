// Imports =============================================================================================================

import DependencyLoadContext from 'depload'

import ConfigService  from './config/Config.service.ts'
import LoggingService from './logging/Logging.service.ts'
import I2CBMSService  from './integrations/I2C_BMS.service.ts'

// App ================================================================================================================

const dl = new DependencyLoadContext()

dl.registerService(ConfigService)
dl.registerService(LoggingService)
dl.registerService(I2CBMSService)

const stop = () => dl.stop()
process.on('SIGTERM', stop)
process.on('SIGINT', stop)

dl.start()

// Info ================================================================================================================

// Exit codes:

// 1xx - BMS service
// 101 - No SMBUS module
// 102 - Too many python script restarts