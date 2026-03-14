// Imports =============================================================================================================

import http     from 'node:http'
import https    from 'node:https'
import fs       from 'node:fs/promises'
import path     from 'node:path'
import url      from 'node:url'
import crypto   from 'node:crypto'

import express, { type Request, type RequestHandler, type Response }  from 'express'
import cookies  from 'cookie-parser'
import argon    from 'argon2'

import type DatabaseService        from "../db/Database.service.ts"
import type { LoggingScope }       from "../logging/Logging.service.ts"
import type LoggingService         from "../logging/Logging.service.ts"
import type ConfigService          from '../config/Config.service.ts'
import x509                        from './x509.ts'
import fsu                         from '../utils/Fs.ts'
import requestLogging              from './middleware/RequestLogging.ts'
import session                     from './middleware/Session.ts'
import type VideoManagementService from '../integrations/VideoManagement.service.ts'

const dirname = path.dirname(url.fileURLToPath(import.meta.url))

// Service =============================================================================================================

export default class HTTPService {

    public static name = 'http'
    public static deps = ['logging', 'db', 'config', 'vm']

    private ls: LoggingScope
    private db: DatabaseService
    private config: ConfigService['settings']
    private videos: VideoManagementService

    private declare app: express.Express
    private declare http: http.Server
    private declare https: https.Server
    private declare server: http.Server | https.Server

    constructor(deps: { logging: LoggingService, db: DatabaseService, config: ConfigService, vm: VideoManagementService }) {
        
        this.ls = deps.logging.getScope(import.meta.url)
        this.db = deps.db
        this.config = deps.config.settings
        this.videos = deps.vm
        this.app = express()

        this.app.use(requestLogging(deps.logging))
        this.app.use(cookies())
        this.app.use(express.json())
        this.app.use(express.static(path.join(dirname, '../../site')))

        this.app.use('/api', session(deps.db, deps.logging, /\/session\/login/))

        for (const name of Object.getOwnPropertyNames(this)) {
            if (name.startsWith('_')) {
                // @ts-ignore
                const meta = this[name] as [string, string] // [method, path]
                // @ts-ignore
                const method = (this[name.replace('_', '')] as RequestHandler).bind(this)
                // @ts-ignore
                this.app[meta[0].toLowerCase()](meta[1], method)
                this.ls.debug(`Registered route: ${meta[0]} ${meta[1]}`)
            }
        }

    }

    public async initializer() {

        this.ls.info('Starting HTTP service...')

        const config = this.config.web

        if (config.enableTLS) {

            const pem = await this.getCertificate()
            
            if (!pem.success) {
                this.ls.error('Failed to obtain SSL certificate. HTTPS will not be enabled.')
                this.http = http.createServer(this.app)
                this.server = this.http
                await this.listen()
            }
            else {
                this.https = https.createServer({ cert: pem.cert, key: pem.key }, this.app)
                this.http = http.createServer((req, res) => {
                    res.writeHead(301, { 'Location': `https://${req.headers.host}${req.url}` })
                    res.end()
                })
                this.server = this.https
                await this.listen()
            }

        } 
        
        else {

            this.http = http.createServer(this.app)
            this.server = this.http
            await this.listen()

        }

        this.ls.info('HTTP service started.')
    
    }

    public async destructor() {
        this.ls.info('Stopping HTTP service...')
        if (this.http) await new Promise<void>((resolve, reject) => this.http.close(err => err ? reject(err) : resolve()))
        if (this.https) await new Promise<void>((resolve, reject) => this.https.close(err => err ? reject(err) : resolve()))
        this.ls.info('HTTP service stopped.')
    }

    private async listen() {
        if (this.https) {
            await new Promise<void>((resolve) => {
                this.https.listen(this.config.web.securePort, () => {
                    this.ls.info(`HTTPS server listening on port ${this.config.web.securePort}`)
                    resolve()
                })
            })
            await new Promise<void>((resolve) => {
                this.http.listen(this.config.web.port, () => {
                    this.ls.info(`HTTP server listening on port ${this.config.web.port} and redirecting to HTTPS`)
                    resolve()
                })
            })
        }
        else {
            await new Promise<void>((resolve) => {
                this.http.listen(this.config.web.port, () => {
                    this.ls.info(`HTTP server listening on port ${this.config.web.port}`)
                    resolve()
                })
            })
        }
    }

    private async getCertificate(): Promise<{ success: boolean, cert?: string, key?: string }> {
        try {

            const conf = this.config.web.ssl
            if (!conf.auto) {
                return {
                    key: await fs.readFile(path.join(dirname, '../../', conf.key), 'utf-8'),
                    cert: await fs.readFile(path.join(dirname, '../../', conf.cert), 'utf-8'),
                    success: true,
                }
            }

            const certPath     = path.join(dirname, '../../etc/tls/cert.pem')
            const keyPath      = path.join(dirname, '../../etc/tls/key.pem')
            const tlsPath      = path.join(dirname, '../../etc/tls')
            const filesPresent = await fsu.exists(certPath) && await fsu.exists(keyPath)

            const generate = async () => {

                await fs.mkdir(tlsPath, { recursive: true })
                
                const { cert, key } = await x509.generateX509Cert({
                    days: conf.lifespan,
                    keySize: conf.keySize,
                    alg: 'sha256',
                    commonName: conf.commonName,
                    countryName: conf.countryName,
                    localityName: conf.localityName,
                    organizationName: conf.orgName
                })

                await fs.writeFile(certPath, cert)
                await fs.writeFile(keyPath, key)

                return { cert, key, success: true }

            }

            if (filesPresent) {

                const cert    = await fs.readFile(certPath, 'utf-8')
                const key     = await fs.readFile(keyPath, 'utf-8')
                const details = x509.readCertData(cert)

                if (details.validFrom > new Date() || details.validTo < new Date()) {
                    return generate()
                }
                else {
                    return { cert, key, success: true }
                }

            }

            else {
                return generate()
            }

        } 
        catch (error) {
            this.ls.error(error!)
            return { success: false }
        }
    }

    // Methods ---------------------------------------------------------------------------------------------------------

    public _login = ['POST', '/api/session/login']
    public async login(req: Request, res: Response) {
        try {

            const name = req.body.username
            const pass = req.body.password

            if (!name || !pass) return res.status(401).end()

            const user = await this.db.client.user.findFirst({ where: { name } })
            if (!user) return res.status(401).end()

            const passMatch = await argon.verify(user.pass, pass)
            if (!passMatch) return res.status(401).end()

            const id = crypto.randomBytes(32).toString('base64url')
            const session = await this.db.client.session.create({ data: { id, name } })
            res.cookie('sid', session.id, { httpOnly: true, secure: !!this.https, sameSite: 'strict' })
            res.status(200).end()

            this.ls.info(`New session created for user "${name}" - ${session.id.substring(0, 6)}...${session.id.substring(session.id.length - 6)}.`)

        } 
        catch (error) {
            this.ls.error(error!)
            res.status(500).end()    
        }
    }

    public _renewSession = ['POST', '/api/session/renew']
    public async renewSession(req: Request, res: Response) {
        try {
            await this.db.client.session.update({ where: { id: req.session.id }, data: { updated: new Date() } })
            res.status(200).send(JSON.stringify({ username: session.name })).end()
        } 
        catch (error) {
            this.ls.error(error!)
            res.status(500).end()    
        }
    }

    public _listRecordings = ['GET', '/api/recordings/list']
    public async listRecordings(req: Request, res: Response) {
        try {
            const list = await this.videos.listRecordings()
            res.status(200).send(JSON.stringify(list)).end()
        } 
        catch (error) {
            this.ls.error(error!)
            res.status(500).end()    
        }
    }

    public _streamRecording = ['GET', '/api/recordings/stream/:video']
    public async streamRecording(req: Request, res: Response) {
        try {

            const fileName = path.normalize(req.params.video as string)
            if (!fileName.endsWith('.mp4')) return res.status(400).end()

            const exists = await this.videos.recordingExists(fileName)
            if (!exists) return res.status(404).end()

            const stream = await this.videos.createStream(fileName)
            stream.pipe(res)

        } 
        catch (error) {
            this.ls.error(error!)
            res.status(500).end()    
        }
    }

}