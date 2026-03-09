// Imports =============================================================================================================

import type { NextFunction, Request, Response } from "express"

import type DatabaseService from "../../db/Database.service.ts"
import type LoggingService from "../../logging/Logging.service.ts"

// Exports =============================================================================================================

export default function session(db: DatabaseService, log: LoggingService, except: RegExp) {
    
    const ls = log.getScope(import.meta.url)
    ls.debug('Session middleware initialized.')

    return async (req: Request, res: Response, next: NextFunction) => {
        try {

            if (except.test(req.path)) return next()

            const sid = req.cookies.sid
            if (!sid) return res.status(401).end()

            const session = await db.client.session.findFirst({ where: { id: sid } })
            if (!session) return res.status(401).end()

            req.session = session
            next()

        } 
        catch (error) {
            ls.error('Session middleware encountered an error:', error!)
            res.status(500).end()
        }
    }

}

declare global {
    namespace Express {
        interface Request {
            session: {
                id: string
                name: string
                updated: Date
            }
        }
    }
}