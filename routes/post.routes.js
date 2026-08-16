const express = require('express')
const router = express.Router()
const postCtrl = require('../controllers/posts.controllers')
const { requireAuth, requireRole } = require('../middleware/auth')

// Every post route requires a valid token; ownership is checked in the
// controller, since it depends on the record being acted on.
router.get('/', requireAuth, postCtrl.getPosts)
router.get('/my-posts/:id', requireAuth, postCtrl.getUserPosts)

router.post('/create', requireAuth, requireRole('parent'), postCtrl.create)
router.delete('/delete/:id', requireAuth, requireRole('parent'), postCtrl.deletePost)
router.put('/update/:id', requireAuth, requireRole('parent'), postCtrl.updateStatus)

router.put('/tutor-apply/:id', requireAuth, requireRole('tutor'), postCtrl.applyToPost)

module.exports = router
