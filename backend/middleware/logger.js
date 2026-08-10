const { format } = require('date-fns')
const { v4 : uuid} = require('uuid')
const fs = require('node:fs')
const fsPromises = require('node:fs/promises')
const path = require('node:path')


const logsDir = path.join(__dirname, '..', 'logs')

const LogEvents = async (message, logFileName) => {
    const dateTime = format(new Date(), "yyyy-MM-dd\tHH:mm:ss")
    const logItem = `${dateTime}\t${uuid()}\t${message}\n`

    try {
        if(!fs.existsSync(logsDir)){
            await fsPromises.mkdir(logsDir)
        }
        await fsPromises.appendFile(path.join(logsDir, logFileName), logItem)
    } catch (error) {
        console.error(error)
    }
}

const logger = (req, res, next) => {
    LogEvents(`${req.method}\t${req.url}\t${req.headers.origin || "no-origin"}`, "reqLog.log")
    console.log(`${req.method} ${req.path}`)
    next()
}

module.exports = {LogEvents, logger}