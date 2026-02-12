import yaml from 'yaml'
import path from 'node:path'
import url from 'node:url'
import fs from 'node:fs/promises'
import z from 'zod'

const dirname = path.dirname(url.fileURLToPath(import.meta.url))

export default class ConfigService {

    public static name = 'config'
    public static deps = []

    public path = path.join(dirname, '../../config.yaml')
    public declare settings: TConfig

    public constructor() {}

    public async initializer() {

        const file = await fs.readFile(this.path, 'utf-8')
        this.settings = yaml.parse(file)

        const result = ZConfig.safeParse(this.settings)
        
        if (!result.success) {
            console.error(`Could not load server configuration. Failed type checks:\n`)
            console.error(result.error)
            process.exit(1)
        }

    }

}

const ZConfig = z.object({

    motionDetect: z.object({
        probing: z.number().min(1).max(10),
        threshold: z.number().min(0).max(1),
    }),

    battery: z.object({
        shutdownThreshold: z.number().min(1).max(100),
    }),

    logging: z.object({
        folder: z.string(),
        level: z.enum(['crit', 'error', 'warn', 'notice', 'info', 'http', 'debug']),
        maxLogFiles: z.union([z.string(), z.number().min(1)]),
        maxLogSize: z.union([z.string(), z.number().min(1)]),
    }),

    web: z.object({
        port: z.number().min(1).max(65535),
    })

})

export type TConfig = z.infer<typeof ZConfig>
