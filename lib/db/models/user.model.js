import mongoose from 'mongoose'
import bluebird from 'bluebird'
import crypto from 'crypto'

const UserSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'full name is required'],
    minlength: [5, 'full name cannot be less than 5 letters']
  },

  email: {
    type: String,
    required: [true, 'email is required']
  },
  password: {
    type: String,
    select: false,
    required: [true, 'password is required'],
    minlength: [4, 'password cannot be less than 4 characters']
  },

  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date
  },

  salt: {
    type: String,
    select: false
  }
});

/**
 * Methods
 */
UserSchema.methods = {
  /**
   * Authenticate - check if the passwords are the same
   *
   * @param {String} password
   * @param {Function} callback
   * @return {Boolean}
   * @api public
   */
  authenticate (password) {
    return this.password === this.encryptPassword(password)
  },

  /**
   * Make salt
   *
   * @param {Number} byteSize Optional salt byte size, default to 16
   * @return {String}
   * @api public
   */
  makeSalt (byteSize = 16) {
    return crypto.randomBytes(byteSize).toString('base64')
  },

  /**
   * Encrypt password
   *
   * @param {String} password
   * @return {String}
   * @api public
   */
  encryptPassword (password) {
    if (!password || !this.salt) {
      return null
    }

    var defaultIterations = 10000
    var defaultKeyLength = 64
    var salt = Buffer.from(this.salt, 'base64')

    return crypto.pbkdf2Sync(password, salt, defaultIterations, defaultKeyLength, 'sha512')
                   .toString('base64')
  }
}

// Public profile information
UserSchema
  .virtual('profile')
  .get(function () {
    return {
      'email': this.email,
      'name': `${this.lastName}, ${this.firstName} ${this.otherNames}`,
      'address': this.address,
      'phone': this.phone
    }
  })

// Non-sensitive info we'll be putting in the token
UserSchema
  .virtual('token')
  .get(function () {
    return {
      '_id': this._id,
      'firsfullName': this.firstName,
      'email': this.email
    }
  })

// Validate email is not taken
UserSchema
  .path('email')
  .validate({
    isAsync: true,
    validator: function (email) {
      const self = this
      return new bluebird.Promise(async (resolve, reject) => {
        const user = await self.constructor.findOne({ email })
        user === null
          ? resolve(true)
          : resolve(false)
      })
    },
    message: 'The specified email is already in use'
  })

var validatePresenceOf = (value) => {
  return value && value.length
}

UserSchema
  .pre('save', function (next) {
    var currentDate = new Date()
    this.updatedAt = currentDate

    // Handle new/update passwords
    if (this.isModified('password')) {
      if (!validatePresenceOf(this.password) && authTypes.indexOf(this.provider) === -1) {
        next(new Error('Invalid password'))
      }

      // Make salt with a callback
      try {
        this.salt = this.makeSalt()
      } catch (ex) {
        return next(ex)
      }

      // encrypt password
      try {
        this.password = this.encryptPassword(this.password)
      } catch (ex) {
        return next(ex)
      }

      next()
    } else {
      next()
    }
  })

UserSchema.index({ email: 1 }, { background: true })

export default mongoose.model('User', UserSchema)
