const express = require('express');
const aiService = require('../services/aiService');

const router = express.Router();

// AI health check
router.get('/health', async (req, res) => {
  try {
    const health = await aiService.checkHealth();

    return res.json({
      success: true,
      available: health.available,
      model: health.model,
      error: health.error || null,
    });
  } catch (error) {
    console.error('[AI] Health check failed:', error.message);

    return res.status(500).json({
      success: false,
      available: false,
      message: 'Unable to check AI service health.',
      error: error.message,
    });
  }
});

// AI chat
router.post('/chat', async (req, res) => {
  try {
    const { message, question } = req.body;

    const userMessage = message || question;

    if (!userMessage || typeof userMessage !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Message is required.',
      });
    }

    const result = await aiService.chat(userMessage);

    return res.json({
      success: true,
      answer: result.answer,
      contextSources: result.contextSources || [],
    });
  } catch (error) {
    console.error('[AI] Chat failed:', error.message);

    return res.status(500).json({
      success: false,
      message: error.message || 'Unable to generate AI response.',
    });
  }
});

module.exports = router;