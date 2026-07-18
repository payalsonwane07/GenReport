const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
  },
  role: {
    type: String,
    default: 'user',
    enum: ['user', 'admin'],
  },
  theme: {
    type: String,
    default: 'auto',
    enum: ['light', 'dark', 'auto'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
  lastLogin: {
    type: Date,
    default: null,
  },
});

module.exports = mongoose.model('User', userSchema);
