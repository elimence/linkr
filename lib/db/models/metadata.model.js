import mongoose from 'mongoose';

const MetadataSchema = new mongoose.Schema({
  link: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Link',
    required: true
  },

  ip: String,
  ips: [String],
  protocol: String,
  secure: String,
  xhr: Boolean,

  deviceName: String,
  deviceType: String,

  city: String,

  createdAt: {
    type: Date,
    default: Date.now
  }
});

MetadataSchema.index({ ip: 1}, { background: true });
MetadataSchema.index({ link: 1}, { background: true });

export default mongoose.model('Metadata', MetadataSchema);
