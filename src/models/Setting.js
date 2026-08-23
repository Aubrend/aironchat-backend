const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  groq_api_key: { type: String, default: '' },
  openai_api_key: { type: String, default: '' },
  deepseek_api_key: { type: String, default: '' },
  anthropic_api_key: { type: String, default: '' },
  updatedAt: { type: Date, default: Date.now }
});

settingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Setting', settingSchema);