const mongoose = require('mongoose')

if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set — the API will start but every query will fail')
}

// An unhandled rejection here would take the whole process down on startup.
mongoose.connect(process.env.DATABASE_URL).catch(function (error) {
    console.error('Initial MongoDB connection failed:', error.message)
})

const db = mongoose.connection

db.on('connected', function() {
    console.log(`Connected to ${db.name} at ${db.host}: ${db.port}`)
})

// Without these a failed connection is silent and every request just hangs.
db.on('error', function(error) {
    console.error('MongoDB connection error:', error.message)
})

db.on('disconnected', function() {
    console.warn('MongoDB disconnected')
})