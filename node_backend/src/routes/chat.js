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

function buildReportContextMessage(report) {
  if (!report) {
    return 'You are a helpful assistant helping the user analyze an uploaded report. If report context is available, use it to answer questions.';
  }

  const analytics = report.analytics && typeof report.analytics === 'object' ? report.analytics : {};
  const parsedData = Array.isArray(report.parsedData) ? report.parsedData : [];
  const columns = Array.isArray(analytics.columns) && analytics.columns.length
    ? analytics.columns
    : (parsedData[0] && typeof parsedData[0] === 'object' ? Object.keys(parsedData[0]) : []);

  const summaryLines = [
    `Report title: ${report.title || 'Untitled Report'}`,
    `File name: ${report.fileName || 'N/A'}`,
    `Total rows: ${analytics.totalRows ?? parsedData.length}`,
    `Total columns: ${analytics.totalColumns ?? columns.length}`,
  ];

  if (columns.length) {
    summaryLines.push(`Columns: ${columns.join(', ')}`);
  }

  if (analytics.numericStats && Object.keys(analytics.numericStats).length > 0) {
    const numericSummary = Object.entries(analytics.numericStats)
      .slice(0, 5)
      .map(([col, stats]) => {
        const statsText = [];
        if (stats.min != null) statsText.push(`min=${stats.min}`);
        if (stats.max != null) statsText.push(`max=${stats.max}`);
        if (stats.average != null) statsText.push(`avg=${stats.average}`);
        if (stats.mean != null) statsText.push(`mean=${stats.mean}`);
        return `${col}: ${statsText.join(', ')}`;
      })
      .join('; ');

    if (numericSummary) {
      summaryLines.push(`Numeric summary: ${numericSummary}`);
    }
  }

  if (parsedData.length > 0) {
    const sampleRows = parsedData.slice(0, 8).map((row, index) => `${index + 1}. ${JSON.stringify(row)}`);
    summaryLines.push(`Sample rows:\n${sampleRows.join('\n')}`);
  }

  return [
    'You are a helpful assistant helping the user analyze an uploaded report.',
    'Use the report context below when answering questions about the report.',
    ...summaryLines,
    'Answer based on this context and the conversation history. If details are missing, say so clearly.',
  ].join('\n');
}

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

    let report = null;

    // If reportId is provided, verify it belongs to the user
    if (reportId) {
      report = await Report.findOne({ _id: reportId, userId });
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

    // Build messages array for Groq API with report context and conversation history
    const messages = [
      {
        role: 'system',
        content: buildReportContextMessage(report),
      },
      ...conversationHistory.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    ];

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
