const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const memoryChunkSchema = new mongoose.Schema({
  topic: { type: String, required: true },
  summary: { type: String, required: true },
  importantPoints: [String],
  sourceConversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, default: '' },
  photoUrl: { type: String, default: null },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  memoryChunks: [memoryChunkSchema],
  createdAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);