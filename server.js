const express = require('express')
const cors = require('cors')
require('dotenv').config()
const { isConnected } = require('./config/database')
const userRoute = require('./routes/user.routes')
const postRoute = require('./routes/post.routes')

const app = express()

/* Set CORS_ORIGIN to the deployed frontend URL to lock this down; with it
   unset the API stays open, which is convenient locally. */
const allowedOrigin = process.env.CORS_ORIGIN
app.use(cors(allowedOrigin ? { origin: allowedOrigin.split(',').map(o => o.trim()) } : undefined))

app.use(express.json())

/* Reports the database too. A health check that answers "ok" while the
   database is unreachable is worse than no health check: the service looks
   fine to anything watching it while every real request fails. */
app.get('/health', function (req, res) {
    const database = isConnected() ? 'up' : 'down'
    res.status(database === 'up' ? 200 : 503).json({ status: database === 'up' ? 'ok' : 'degraded', database })
})

/* Say what is actually wrong. Without this a request against a down
   database surfaces as a generic 500 from a controller's catch — sign-in
   answered "Could not sign you in", which reads as wrong credentials when
   the real problem is that the database cannot be reached. */
app.use('/api', function (req, res, next) {
    if (isConnected()) return next()
    res.status(503).json({
        message: 'The database is unavailable right now. Please try again shortly.',
    })
})

app.use('/api/users', userRoute)
app.use('/api/posts', postRoute)

// const seeding = require('./models/seedData')
// seeding.seedTutors()

app.use(function (req, res) {
    res.status(404).json({ message: 'Not found' })
})

// Last-resort handler so an unexpected throw returns JSON rather than an
// HTML stack trace.
app.use(function (error, req, res, next) {
    console.error(error)
    res.status(500).json({ message: 'Something went wrong' })
})

const PORT = process.env.PORT || 3005

app.listen(PORT, function() {
    console.log(`Express app is running on ${PORT}`)
})
