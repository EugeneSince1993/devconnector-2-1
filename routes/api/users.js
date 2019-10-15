const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator');

const User = require('../../models/User');

// @route   POST api/users
// @desc    Register user
// @access  Public 
router.post('/',
  [check('name', 'Name is required').not().isEmpty(),
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Please enter a password with 6 or more characters').
    isLength({ min: 6 })],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
      // See if user exists
      let user = await User.findOne({ email });

      if (user) {
        return res.status(400).json({ errors: [{ msg: 'User already exists' }] });
      }

      // Get user's gravatar
      const avatar = gravatar.url(email, {
        s: '200', // size
        r: 'pg', // rating - "pt" is put so that we don't have naked people etc
        d: 'mm' // default - "mm" gives us a default image like an user icon 
      });

      // Create an instance of User (not saving to the database yet)
      user = new User({
        name,
        email,
        avatar,
        password
      });

      /* Encrypt password. 
      We need to create a salt to do the hashing with. In genSalt we pass in so called rounds. The more you have - the more secure, but slower it can be. Value of 10 is recommended by the documentation of bcrypt. */
      const salt = await bcrypt.genSalt(10);

      // Finally hash (encrypt) a password
      user.password = await bcrypt.hash(password, salt);

      // Save user to the database. save() give us a promise, so we'll use "await".
      await user.save();

      // Return jsonwebtoken
      const payload = {
        user: {
          id: user.id
        }
      }

      jwt.sign(
        payload,
        config.get('jwtSecret'),
        {
          expiresIn: 360000 /* an hour (3600) for production (and deployment, for sure),                         but we put 360000 seconds for our testing 
                               so that it not to expire quickly */
        }, (err, token) => {
          if (err) throw err;
          res.json({ token });
        });

    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }

  });

module.exports = router;