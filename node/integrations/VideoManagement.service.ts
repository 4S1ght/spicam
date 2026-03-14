// Imports =============================================================================================================

import path     from 'node:path'
import url      from 'node:url'
import fs       from 'node:fs/promises'
import events   from 'node:events'

import type LoggingService from '../logging/Logging.service.ts'
import type { LoggingScope } from '../logging/Logging.service.ts'

const dirname = path.dirname(url.fileURLToPath(import.meta.url))

// Types ===============================================================================================================


// Service =============================================================================================================

export default class VideoManagementService {

    public static name = 'vm'
    public static deps = ['logging']

    private recordingsDir = path.join(dirname, '../../etc/recordings')

    private ls: LoggingScope

    constructor(deps: { logging: LoggingService}) {
        this.ls = deps.logging.getScope(import.meta.url)
    }

    public async initializer() {
        this.ls.info('Starting video management service...')
        this.ls.info('Video management service started.')
    }

    public async destructor() {
        this.ls.info('Stopping video management service...')
        this.ls.info('Video management service stopped.')
    }

    public async recordingExists(name: string) {
        try {
            await fs.access((path.join(this.recordingsDir, path.normalize(name))))
            return true
        } 
        catch {
            return false    
        }
    }

    public async listRecordings() {

        const entries = await fs.readdir(this.recordingsDir, { withFileTypes: true })

        const files = await Promise.all(
            entries
                .filter(entry => entry.isFile())
                .map(async entry => {
                    const filePath = path.join(this.recordingsDir, entry.name)
                    const stats = await fs.stat(filePath)

                    return {
                        name: entry.name,
                        size: stats.size,
                        date: stats.birthtime.toISOString(),
                    };
                })
        );

        return files

    }

    public async createStream(recording: string){
        
        const filePath = path.join(this.recordingsDir, path.normalize(recording))
        const file = await fs.open(filePath, 'r')
        const stream = file.createReadStream()
        let closed = false

        const cleanup = () => {
            if (!closed) {
                closed = true
                file.close()
            }
        }

        stream.once('close', () => cleanup())
        stream.once('error', () => cleanup())
        
        return stream

    }

}   