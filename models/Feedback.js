const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
  repo: String,
  email: String,
  task: String,
  feedback: String,
  grade: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Feedback', FeedbackSchema);
