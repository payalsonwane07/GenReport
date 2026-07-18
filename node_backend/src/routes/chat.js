const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ChatMessage = require('../models/ChatMessage');
const Report = require('../models/Report');
const { Groq } = require('groq-sdk');

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// POST - Send chat message and get AI response
router.post('/', auth, async (req, res) => {
  console.log('[CHAT POST] Incoming request - Body:', { reportId: req.body.reportId, messageLength: req.body.message?.length, userId: req.user.id });
  try {
    const { reportId, message } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    // If reportId is provided, verify it belongs to the user
    if (reportId) {
      const report = await Report.findOne({ _id: reportId, userId });
      if (!report) {
        return res
          .status(404)
          .json({ message: 'Report not found or access denied' });
      }
    }

    // Save user message to database
    const userMessage = new ChatMessage({
      userId,
      reportId: reportId || null,
      role: 'user',
      content: message.trim(),
    });
    await userMessage.save();

    // Fetch conversation history (last 10 messages for this reportId)
    const conversationHistory = await ChatMessage.find({
      userId,
      reportId: reportId || null,
    })
      .sort({ createdAt: 1 })
      .limit(10)
      .select('role content -_id');

    // Build messages array for Groq API with conversation history
    const messages = conversationHistory.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Call Groq API with llama-3.3-70b-versatile model
    const groqResponse = await groq.chat.completions.create({
      messages,
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 1024,
    });

    const assistantReply =
      groqResponse.choices[0]?.message?.content ||
      'Unable to generate response';

    // Save assistant message to database
    const assistantMessage = new ChatMessage({
      userId,
      reportId: reportId || null,
      role: 'assistant',
      content: assistantReply,
    });
    await assistantMessage.save();

    // Return the assistant's reply
    res.status(201).json({
      message: 'Message processed successfully',
      userMessage: userMessage.content,
      assistantMessage: assistantReply,
      userMessageId: userMessage._id,
      assistantMessageId: assistantMessage._id,
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      message: 'Error processing chat message',
      error: error.message,
    });
  }
});

// GET - Retrieve chat history for a specific report
router.get('/:reportId', auth, async (req, res) => {
  console.log('[CHAT GET] Incoming request - ReportId:', req.params.reportId, '- UserId:', req.user.id);
  try {
    const { reportId } = req.params;
    const userId = req.user.id;

    // Verify report belongs to the user
    const report = await Report.findOne({ _id: reportId, userId });
    if (!report) {
      return res
        .status(404)
        .json({ message: 'Report not found or access denied' });
    }

    // Fetch all chat messages for this report
    const messages = await ChatMessage.find({
      userId,
      reportId,
    })
      .sort({ createdAt: 1 })
      .select('role content createdAt -_id');

    res.status(200).json({
      message: 'Chat history retrieved successfully',
      reportId,
      messages,
      count: messages.length,
    });
  } catch (error) {
    console.error('Error retrieving chat history:', error);
    res.status(500).json({
      message: 'Error retrieving chat history',
      error: error.message,
    });
  }
});

module.exports = router;
