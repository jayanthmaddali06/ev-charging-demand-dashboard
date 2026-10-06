const axios = require('axios');
const { GoogleGenAI } = require('@google/genai');

const aiContextService = require('./aiContextService');

class AiService {
  constructor() {
    this.baseUrl = (process.env.OLLAMA_BASE_URL || 'http://localhost:11434').replace(/\/$/, '');
    this.model = process.env.OLLAMA_MODEL || 'llama3.2';

    this.gemini = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
  });
  }

async checkHealth() {
  try {
    await this.gemini.models.generateContent({
      model: 'gemini-3.5-flash-lite',
      contents: 'Reply with OK.',
      config: {
        maxOutputTokens: 2,
      },
    });

    return {
      available: true,
      model: 'gemini-3.5-flash-lite'
    };
  } catch (err) {
    return {
      available: false,
      model: 'gemini-3.5-flash-lite',
      error: err.message
    };
  }
}

  async chat(question) {
    const userMessage = typeof question === 'string' ? question.trim() : '';

    if (!userMessage) {
      throw new Error('Message is required.');
    }

    const normalizedMessage = userMessage.toLowerCase().replace(/[!?.,]/g, '').trim();
    const casualReplies = new Map([
      ['hello', "Hey! I'm EVCharge AI. What would you like to know about your EV charging data?"],
      ['hi', "Hi! What would you like to explore?"],
      ['hey', "Hey! What can I help you with?"],
      ['how are you', "I'm doing well, thanks! Ready to help with your EV charging questions."],
      ['what can you do', 'I can help explore charging demand, time trends, anomalies, clusters, predictions, and model performance.'],
      ['thanks', "You're welcome!"],
      ['thank you', "You're welcome!"]
    ]);

    if (casualReplies.has(normalizedMessage)) {
      return {
        answer: casualReplies.get(normalizedMessage),
        contextSources: []
      };
    }

    if (normalizedMessage.includes('average charging demand')) {
      const { context, contextSources } = aiContextService.buildRelevantContext(userMessage);
      const averageDemand = Number(context.summary?.averageChargingDemand);

      if (Number.isFinite(averageDemand)) {
        return {
          answer: `The average charging demand is ${averageDemand.toFixed(2)} kilowatts.`,
          contextSources
        };
      }
    }

    if (/\b(live|real time|right now|currently)\b/.test(normalizedMessage)
      && /\b(station|charger|charging)\b/.test(normalizedMessage)) {
      return {
        answer: "I can't see live station status. The available project data is historical, not real-time.",
        contextSources: []
      };
    }

    const { intent, context, contextSources } = aiContextService.buildRelevantContext(userMessage);
    const contextSizeBytes = Buffer.byteLength(JSON.stringify(context));
    console.info(`[AiService] intent=${intent} contextBytes=${contextSizeBytes}`);
    const contextualQuestion = contextSources.length
      ? `User question: ${userMessage}\n\nProject evidence:\n${JSON.stringify(context)}`
      : userMessage;

    const systemPrompt = `You are EVCharge AI, a friendly EV charging analytics assistant. Answer naturally and briefly, usually in 1-3 sentences. Use only the compact structured project evidence supplied with the question. Preserve the meaning and exact values of its fields; never invent or relabel counts, dates, units, model metrics, predictions, or live status. In particular, totalRecords is not the anomaly count: use anomalyCount for flagged anomalies. Treat observations as historical unless evidence explicitly says otherwise; predictions are not observations. If data is missing, say so. Do not add unrelated sections or unsolicited lists.`;

    try {
  const response = await this.gemini.models.generateContent({
    model: 'gemini-3.5-flash-lite',
    contents: contextualQuestion,
    config: {
      systemInstruction: systemPrompt,
      maxOutputTokens: 48,
      temperature: 0
    }
  });

  let answer = response?.text;

  if (typeof answer !== 'string' || !answer.trim()) {
    throw new Error('Malformed Gemini response.');
  }

  if (!aiContextService.isAnswerGrounded(intent, answer, context)) {
    answer = aiContextService.buildTimeoutAnswer(intent, context) || answer;
  }

  return {
    answer: answer.trim(),
    contextSources
  };

} catch (err) {
  console.error('[AiService] Gemini error:', err.message);

  if (/timeout|deadline/i.test(err.message || '')) {
    const fallbackAnswer = aiContextService.buildTimeoutAnswer(intent, context);

    if (fallbackAnswer) {
      return { answer: fallbackAnswer, contextSources };
    }

    throw new Error('Gemini timed out while generating a response. Please try again.');
  }

  if (err.message === 'Malformed Gemini response.') {
    throw err;
  }

  throw new Error(err.message || 'Unable to generate an AI response.');
}
}
}
module.exports = new AiService();
