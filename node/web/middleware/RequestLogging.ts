
// ============================================================================

import c from "chalk"

import type { Request, Response, NextFunction } from "express"
import type LoggingService from "../../logging/Logging.service.ts"

// ============================================================================

export default function requestLogging(log: LoggingService) {

    const ls = log.getScope(import.meta.url)
    ls.debug('Request logging middleware initialized.')

    let currentID = 0

    const getRequestID = () => {
        const id = (currentID++).toString(16).padStart(5, '0')
        if (id === 'fffff') currentID = 0
        return c.grey(id)
    }

    const getStatusCodeColor = (code: number) => {
        if (code <= 199) return c.blue(code)
        if (code <= 299) return c.green(code)
        if (code <= 399) return c.cyan(code)
        if (code <= 599) return c.red(code)
    }

    const blankTime = c.grey("*****")
    const reqSign = c.grey('req')
    const resSign = c.whiteBright('res')

    return (req: Request, res: Response, next: NextFunction) => {

        const id = getRequestID()
        const method = c.green(req.method)
        const ip = c.grey(req.ip)
        const url = req.originalUrl
        const start = Date.now()
    
        ls.http(`${id} ${reqSign} ${method}     ${ip} ${blankTime} ${url}`)
        res.on('finish', () => ls.http(`${id} ${resSign} ${method} ${getStatusCodeColor(res.statusCode)} ${ip} ${c.whiteBright((Date.now()-start+'ms').padEnd(5))} ${url}`))
    
        next()
    
    }

}