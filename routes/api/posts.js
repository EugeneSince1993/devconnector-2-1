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

// @route   GET api/posts
// @desc    Get all posts
/* @access  Private - because we can see the Posts page only when 
            we are authorized. We usually need to add "auth" middle as a parameter
            of our route when we practice Private access. */
router.get(
  '/',
  auth,
  async (req, res) => {
    try {
      // to get all items, we use "find()", for single one - "findOne"
      /* parameter of { date: -1 } sort the post from the most recent one.
         { date: 1 } is to sort from the oldest one, but that's the default setting.  */
      const posts = await Post.find().sort({ date: -1 });
      res.json(posts);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   GET api/posts/:id
// @desc    Get post by (its) ID
/* @access  Private */
router.get(
  '/:id',
  auth,
  async (req, res) => {
    try {
       /* Get the post by its ID.
          we insert "await" because mongoose methods like find(),
          findOne() of findById() return a promise.
          "req.params.id" will allow us to get id from the URL. */ 
      const post = await Post.findById(req.params.id);

      if (!post) {
        // status of 404 means "not found"
        return res.status(404).json({ msg: 'Post not found' });
      }

      res.json(post);
    } catch (err) {
      console.error(err.message);
      /* the condition below means "if entered id is 
         a not formatted (valid) ObjectId". e.g, it's
         an ObjectId, the length of the id is valid,
         but id is wrong */
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Post not found' });
      }
      res.status(500).send('Server Error');
    }
  }
);

// @route   DELETE api/posts/:id
// @desc    Delete a post (by its ID)
// @access  Private
router.delete(
  '/:id',
  auth,
  async (req, res) => {
    try {
      /* Get the post by its ID */
      const post = await Post.findById(req.params.id);

      if (!post) {
        return res.status(404).json({ msg: 'Post not found' }); 
      }

      /* Check user.
         We check the user (id) because we wanna be sure that
         the user deleting the post is the one who owns the post.
         "req.user.id" is a logged in user. 
         We check if the post user is equal to the logged in user.
         But "post.user" has a type of "ObjectId", and "req.user.id"
         has a type of "String". So we'll concatenate a "toString()"
         method to the "post.user". */
      if (post.user.toString() !== req.user.id) {
        // status 401 - Not Authorized
        return res.status(401).json({ msg: 'User not authorized' }); 
      }

      await post.remove();
      
      res.json({ msg: 'Post removed' });
    } catch (err) {
      console.error(err.message);
      /* the condition below means "if entered id is 
         a not formatted (valid) ObjectId". e.g, it's
         an ObjectId, the length of the id is valid,
         but id is wrong */
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Post not found' });
      }
      res.status(500).send('Server Error');
    }
  }
);

module.exports = router;
