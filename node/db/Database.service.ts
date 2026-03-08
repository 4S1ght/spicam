// Imports =============================================================================================================

import argon2 from 'argon2'
import prisma from "../../etc/db-client/index.js"

import type LoggingService   from '../logging/Logging.service.ts'
import type { LoggingScope } from '../logging/Logging.service.ts'

// Types ===============================================================================================================

// Types ===============================================================================================================

// Service =============================================================================================================

export default class DatabaseService {

    public static name = 'db'
    public static deps = ['logging']

    private log:    LoggingService
    private ls:     LoggingScope
    public  client: prisma.PrismaClient

    constructor(deps: { logging: LoggingService  }) {
        this.log    = deps.logging
        this.client = new prisma.PrismaClient()
        this.ls     = this.log.getScope(import.meta.url)
    }

    public async initializer() {

        this.ls.info('Starting DB service...')
        await this.client.$connect()
        await this.seed()
        this.periodicCleanSessions()
        this.ls.info('DB service started.')

    }

    public async destructor() {
        this.ls.info('Stopping DB service...')
        this.stopCleaningSessions()
        await this.client.$disconnect()
        this.ls.info('DB service stopped.')
    }


    private async seed() {

        const seeded = await this.getSetting('seeded')

        if (!seeded) {

            this.ls.warn('The database is being seeded.')
        
            await this.client.user.create({
                data: {
                    name: 'root',
                    pass: await argon2.hash('root', {
                        memoryCost: 32 * 1024,
                        parallelism: 1,
                    })
                }
        
            })
        
            this.ls.warn('A new default user was created with username "root" and password "root". Log in and immediately change the password!')

            await this.client.settings.createMany({
                data: [

                    // Misc
                    { key: 'seeded', value: 'true', default: 'true' },

                    // DB settings
                    { key: 'session_duration', value: '60', default: '60' },

                    // General camera settings
                    { key: 'night_vision_contrast', value: '1.25', default: '1.25' },
                    { key: 'night_vision_gain',     value: '20',   default: '20'   },

                    // Motion detection settings
                    { key: 'motion_detect_frame_width',  value: '1920',    default: '1920'    },
                    { key: 'motion_detect_frame_height', value: '1080',    default: '1080'    },
                    { key: 'motion_detect_frame_rate',   value: '2',       default: '2'       },
                    { key: 'motion_detect_min_diff',     value: '0.07',    default: '0.07'    },
                    { key: 'motion_detect_max_diff',     value: '0.35',    default: '0.35'    },

                    // Recording settings
                    { key: 'recording_frame_width',      value: '1920',    default: '1920'    },
                    { key: 'recording_frame_height',     value: '1080',    default: '1080'    },
                    { key: 'recording_frame_rate',       value: '15',      default: '15'      },
                    { key: 'recording_duration_seconds', value: '60',      default: '60'      },
                    { key: 'recording_bitrate',          value: '1000000', default: '1000000' },

                    // Live preview settings
                    { key: 'live_preview_frame_width',   value: '1920',     default: '1920'   },
                    { key: 'live_preview_frame_height',  value: '1080',     default: '1080'   },
                    { key: 'live_preview_frame_rate',    value: '15',      default: '15'      },
                    { key: 'live_preview_bitrate',       value: '1000000', default: '1000000' },

                    // Light controls settings
                    { key: 'led_controls_stdin_polling', value: '1',        default: '1'    },
                    { key: 'led_controls_light_polling', value: '1',        default: '1'    },
                    { key: 'light_sensor_threshold',     value: '0.2',      default: '0.2'  },
                    { key: 'light_sensor_window',        value: '600',      default: '600'  },
                    
                ]
            })
        
        }

    }

    private settingCache = new Map<string, string>()

    public async getSetting(key: string) {
        if (this.settingCache.has(key)) return this.settingCache.get(key)
        const setting = await this.client.settings.findFirst({ where: { key }, select: { value: true } })
        return setting && setting.value
    }

    public async setSetting(key: string, value: string) {
        await this.client.settings.upsert({
            where: { key },
            update: { value },
            create: { key, value, default: value },
        })
        this.settingCache.set(key, value)
    }

    public async resetSetting(key: string) {
        const setting = await this.client.settings.findFirst({ where: { key }, select: { default: true } })
        if (setting) {
            await this.client.settings.update({ where: { key }, data: { value: setting.default } })
            this.settingCache.set(key, setting.default)
        }
    } 

    private declare sessionCleanInterval: NodeJS.Timeout

    private periodicCleanSessions() {
        this.sessionCleanInterval = setInterval(async () => {
            try {

                const sessionDuration = parseInt(await this.getSetting('session_duration') as string)
                const expiryPoint = new Date(Date.now() - sessionDuration * 60 * 1000)
                const sessions = await this.client.session.findMany({ where: { updated: { lt: expiryPoint } } })

                for (const session of sessions) {
                    await this.client.session.delete({ where: { id: session.id } })
                    this.ls.info(`Session "${session.id}" of user "${session.name}" expired.`)
                }

            }
            catch (error) {
                this.ls.error(error!)
            }
        }, 1000*60*5)
    }

    private stopCleaningSessions() {
        clearInterval(this.sessionCleanInterval)
    }

}