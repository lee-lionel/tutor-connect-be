/* Read-only check for duplicate sign-in identifiers in the users collection.
   Makes no writes. Run from the tutor-connect-be directory:

     node check-duplicate-phones.js

   with DATABASE_URL either in .env or in the environment. */

require('dotenv').config()
const mongoose = require('mongoose')

function groupDuplicates(field) {
  return [
    { $group: { _id: `$${field}`, count: { $sum: 1 }, users: { $push: { id: '$_id', name: '$name', email: '$email' } } } },
    { $match: { count: { $gt: 1 } } },
    { $sort: { count: -1 } },
  ]
}

async function main() {
  const uri = process.env.DATABASE_URL
  if (!uri) {
    console.error('DATABASE_URL is not set. Add it to .env (already gitignored) or export it.')
    process.exit(1)
  }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 })
  const users = mongoose.connection.collection('users')

  const total = await users.countDocuments()
  console.log(`\nConnected to "${mongoose.connection.name}" — ${total} user document(s)\n`)

  for (const field of ['phoneNumber', 'email']) {
    const dupes = await users.aggregate(groupDuplicates(field)).toArray()

    if (dupes.length === 0) {
      console.log(`${field}: no duplicates`)
    } else {
      console.log(`${field}: ${dupes.length} duplicated value(s) — the unique index will NOT build until these are resolved`)
      for (const row of dupes) {
        console.log(`   ${JSON.stringify(row._id)} used by ${row.count} accounts:`)
        row.users.forEach((u) => console.log(`      ${u.id}  ${u.name || '(no name)'}  ${u.email || '(no email)'}`))
      }
    }

    // A missing or null value counts as a duplicate for a unique index once
    // more than one document is missing it.
    const missing = await users.countDocuments({ $or: [{ [field]: null }, { [field]: { $exists: false } }] })
    if (missing > 1) {
      console.log(`   note: ${missing} documents have no ${field} — a unique index treats those as colliding too`)
    }
  }

  const indexes = await users.indexes()
  const phoneIndex = indexes.find((i) => i.key && i.key.phoneNumber !== undefined)
  console.log(
    `\nphoneNumber index: ${
      phoneIndex ? `present (unique=${Boolean(phoneIndex.unique)})` : 'not built yet'
    }`
  )

  await mongoose.disconnect()
}

main().catch(async (error) => {
  console.error('\nCheck failed:', error.message)
  await mongoose.disconnect().catch(() => {})
  process.exit(1)
})
