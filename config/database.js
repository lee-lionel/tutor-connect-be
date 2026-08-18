const mongoose = require('mongoose')

if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set — the API will start but every query will fail')
}

/* Two deliberate settings:

   serverSelectionTimeoutMS trims the default 30s wait for a reachable
   server. bufferCommands: false stops Mongoose queueing queries while
   disconnected — the default buffers for ten seconds and then throws, so a
   request against a down database used to sit there for ten seconds before
   failing. Failing in two is no worse an outcome and a much better wait. */
mongoose.connect(process.env.DATABASE_URL, {
    serverSelectionTimeoutMS: 2000,
    bufferCommands: false,
}).catch(function (error) {
    // An unhandled rejection here would take the whole process down on startup.
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

/** 1 is connected; anything else means queries will fail. */
function isConnected() {
    return db.readyState === 1
}

module.exports = { isConnected }
