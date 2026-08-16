const parentPost = require('../models/parentPost.models')

async function create(req, res) {
    try {
        // Authorship comes from the token, so a caller cannot post as someone else.
        const newPost = await parentPost.create({
            createdBy: { id: req.user._id, name: req.user.name },
            title: req.body.title,
            subjects: req.body.subjects,
            level: req.body.level,
            location: req.body.location,
        })
        return res.status(201).json(newPost)
    }
    catch(error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message })
        }
        return res.status(500).json({ message: 'Could not create your post' })
    }
}

async function getPosts(req, res) {
    try{
        const posts = await parentPost.find({foundTutor: false})
        return res.status(200).json(posts)
    } catch(error) {
        return res.status(500).json({message: 'Could not load posts'})
    }
}

async function getUserPosts (req, res) {
    try {
        const userPosts = await parentPost.find({ "createdBy.id": req.user._id })
        return res.status(200).json(userPosts)
    } catch (error) {
        return res.status(500).json({message: 'Could not load your posts'})
    }
}

async function deletePost(req, res) {
    try {
        const post = await parentPost.findById(req.params.id)
        if (!post) {
            return res.status(404).json({message: 'Post not found'})
        }
        if (String(post.createdBy.id) !== String(req.user._id)) {
            return res.status(403).json({message: 'You can only delete your own posts'})
        }

        await post.deleteOne()
        return res.status(200).json({message: 'Post deleted successfully'})
    } catch (error) {
        return res.status(500).json({message: 'Could not delete that post'})
    }
}

async function applyToPost(req, res) {
    try {
        const appliedPost = await parentPost.findById(req.params.id)
        if (!appliedPost) {
            return res.status(404).json({ message: 'Post not found' })
        }

        // The applicant is the signed-in tutor, not whoever the body claims.
        const applicant = { id: req.user._id, name: req.user.name }

        const alreadyApplied = appliedPost.applicants
            .some(app => String(app.id) === String(applicant.id))

        if (alreadyApplied) {
            return res.status(409).json({ message: 'You have already applied for this job' })
        }

        appliedPost.applicants.push(applicant)
        await appliedPost.save()

        return res.status(200).json(appliedPost)
    } catch (error) {
        return res.status(500).json({ message: 'Could not submit your application' })
    }
}

async function updateStatus(req, res) {
    try {
        const post = await parentPost.findById(req.params.id)
        if (!post) {
            return res.status(404).json({ message: 'Post not found' })
        }
        if (String(post.createdBy.id) !== String(req.user._id)) {
            return res.status(403).json({ message: 'You can only update your own posts' })
        }

        post.foundTutor = Boolean(req.body.foundTutor)
        await post.save()

        return res.status(200).json(post)
    } catch (error) {
        return res.status(500).json({ message: 'Could not update that post' })
    }
}

module.exports = {
    create,
    getPosts,
    deletePost,
    applyToPost,
    updateStatus,
    getUserPosts,
}
