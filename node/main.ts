// Imports =============================================================================================================

import DependencyLoadContext from 'depload'

import ConfigService from './config/ConfigService.ts'
import LoggingService from './logging/LoggingService.ts'

// App ================================================================================================================

const dl = new DependencyLoadContext()

dl.registerService(ConfigService)
dl.registerService(LoggingService)

const stop = () => dl.stop()
process.on('SIGTERM', stop)
process.on('SIGINT', stop)

dl.start()

