const express = require('express')
const cors = require('cors')
require('dotenv').config()
require('./config/database')
const userRoute = require('./routes/user.routes')
const postRoute = require('./routes/post.routes')

const app = express()

/* Set CORS_ORIGIN to the deployed frontend URL to lock this down; with it
   unset the API stays open, which is convenient locally. */
const allowedOrigin = process.env.CORS_ORIGIN
app.use(cors(allowedOrigin ? { origin: allowedOrigin.split(',').map(o => o.trim()) } : undefined))

app.use(express.json())

app.get('/health', function (req, res) {
    res.status(200).json({ status: 'ok' })
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
