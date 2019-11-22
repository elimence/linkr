import mongoose from 'mongoose';

const LinkSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  url: {
    type: String,
    required: true
  },
  code: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
  }
});

// Hooks
LinkSchema
  .pre('save', function (next) {
    this.updatedAt = new Date();
    next();
  })
;

UserSchema
  .path('code')
  .validate({
    isAsync: true,
    message: 'The specified identifier is already taken',

    validator: function (code) {
      const self = this;
      return new bluebird.Promise(async (resolve, reject) => {
        const link = await self.constructor.findOne({ code });

        // TODO: Recover gracefully upon collision
        link === null
          ? resolve(true)
          : resolve(false)
      })
    }
  })
;

LinkSchema.index({ code: 1}, { background: true });

export default mongoose.model('Link', LinkSchema);
