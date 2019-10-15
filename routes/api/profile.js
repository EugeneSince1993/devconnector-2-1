const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');

const Profile = require('../../models/Profile');
const User = require('../../models/User');

/* @route   GET api/profile/me - "api/profile/me" is the endpoint. This is
   protected route */
// @desc    Get current user's profile
/* @access  Private - because we're getting the profile by the user.id 
   that's in the token. */
router.get('/me',
  auth,
  async (req, res) => { /* mongoose returns a promise so we'll use async-await */
    try {
      const profile = await Profile.findOne({ user: req.user.id })
        .populate('user', ['name', 'avatar']); /* property of user pertains to the user field (property) in the Profile model file. This user is the "ObjectId" of the user. We're setting it to the req.user.id which comes in with the token. With populate() we're adding fields of name and avatar to the user. */
      if (!profile) {
        /* Status of 400 is a Bad Request Error */
        return res.status(400).json({ msg: 'There is no profile for this user' });
      }

      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error'); /* Status of 500 is an Internal Server Error
      */
    }
  });

module.exports = router;