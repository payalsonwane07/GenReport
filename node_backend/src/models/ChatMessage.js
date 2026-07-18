const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true,
  },
  reportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Report',
    default: null,
    index: true,
  },
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: [true, 'Role is required'],
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
