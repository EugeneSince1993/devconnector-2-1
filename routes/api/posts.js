const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');

const Post = require('../../models/Post');
const Profile = require('../../models/Profile');
const User = require('../../models/User');

// @route   POST api/posts
// @desc    Create a post
/* @access  Private - because you have to be 
            logged in to create a post. */
router.post(
  '/',
  [
    auth,
    [
      check('text', 'Text is required')
      .not().isEmpty()
    ]
  ], 
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      /* we have this "errors" object which has a method "array()" */
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      /* get user by user ID. we logged in so we have the token
      which gives us the user ID and puts it inside the
      "req.user.id". we don't want to send the password back
      so we'll use "select('-password')" */
      const user = await User.findById(req.user.id).select('-password');

      const newPost = new Post({
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        // we need an ObjectId from here below
        user: req.user.id
      });

      const post = await newPost.save();
      // Once we add the post, we'll get it back in the response
      res.json(post);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

module.exports = router;
