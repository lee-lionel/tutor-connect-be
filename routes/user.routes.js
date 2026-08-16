const express = require('express')
const router = express.Router()
const userCtrl = require('../controllers/user.controllers')
const { requireAuth } = require('../middleware/auth')

// Public — you need these to get a token in the first place.
router.post('/', userCtrl.create)
router.post('/sign-in', userCtrl.signIn)

// Everything below requires a valid token.
router.put('/update/:id', requireAuth, userCtrl.updateProfile)
router.get('/list-tutors', requireAuth, userCtrl.listTutors)
router.get('/getMe/:id', requireAuth, userCtrl.getProfile)

module.exports = router
