require('dotenv').config()
const express = require('express')
const corsOptions = require('./config/corsOptions')
const cors = require('cors')
const helmet = require('helmet')
const {apiLimiter} = require('./middleware/rateLimiter')
const {logger} = require('./middleware/logger')
const connectDB = require('./config/DB')
const projectRouter = require('./routes/projectRouter.js')
const taskRouter = require('./routes/taskRouter.js')
const authRouter = require('./routes/authRouter.js')
const statsRouter = require('./routes/statsRouter.js')

const app = express()

const PORT = process.env.PORT || 3000

//Security headers
app.use(helmet())

//Global rate limiting
app.use(apiLimiter)

app.use(logger)

// CORS
app.use(cors(corsOptions))

//JSON body parsing
app.use(express.json())

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({ message: 'Server is healthy' })
})

// API routes — all under /api to match the Vite dev proxy
app.use("/api/auth", authRouter);
app.use("/api/projects", projectRouter);
app.use("/api/projects", taskRouter);
app.use("/api/stats", statsRouter);

// 404 for unknown routes
app.use((req, res) => {
    res.status(404).json({ error: `No route for ${req.method} ${req.originalUrl}`})
})
 

const startServer =  async() => {
    try {
        await connectDB()
        app.listen(PORT, () => console.log(`Server is running on port ${PORT}`))
    } catch (error) {
        console.error("Unable to connect to the database:", error)
    }
}

startServer()