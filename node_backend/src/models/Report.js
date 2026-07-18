const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true,
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
  },
  fileName: {
    type: String,
    default: '',
  },
  storedFileName: {
    type: String,
    default: null,
  },
  fileType: {
    type: String,
    enum: ['csv', 'xlsx', 'json'],
    default: null,
  },
  filePath: {
    type: String,
    default: null,
  },
  pdfPath: {
    type: String,
    default: null,
  },
  parsedData: {
    type: Array,
    default: [],
  },
  analytics: {
    type: Object,
    default: {},
  },
  content: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
  },
  errorMessage: {
    type: String,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Report', reportSchema);
