import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowUpRight,
  Bot,
  BrainCircuit,
  Loader2,
  Send,
  Sparkles,
  Trash2,
  User,
  Wifi,
  WifiOff
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { api } from '../services/api';

const QUICK_ACTIONS = [
  'Explain current demand',
  'Explain peak hours',
  'Explain anomalies',
  'Explain predictions',
  'Explain clusters',
  'Summarize time-series trends',
  'Summarize model performance',
  'Give an overall charging-data summary'
];

const contextLabelMap = {
  summary: 'Charging summary',
  'time-series': 'Time-series analytics',
  clusters: 'Cluster analysis',
  anomalies: 'Anomaly detection',
  'model-evaluation': 'Model evaluation',
  predictions: 'Prediction results'
};

const createTimestamp = () =>
  new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

const renderInlineText = (text) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong
          key={`${part}-${index}`}
          className="font-semibold text-slate-900 dark:text-slate-100"
        >
          {part.slice(2, -2)}
        </strong>
      );
    }

    return (
      <React.Fragment key={`${part}-${index}`}>
        {part}
      </React.Fragment>
    );
  });
};

const renderMessageContent = (text) => {
  const paragraphs = (text || '').split(/\n\s*\n/).filter(Boolean);

  return paragraphs.map((paragraph, paragraphIndex) => {
    const lines = paragraph.split('\n').filter(Boolean);
    const isList = lines.every((line) => /^[-•]\s+/.test(line));

    if (isList) {
      return (
        <ul
          key={`p-${paragraphIndex}`}
          className="list-disc pl-5 space-y-1.5 text-sm leading-6 text-slate-700 dark:text-slate-200"
        >
          {lines.map((line, lineIndex) => (
            <li key={`${line}-${lineIndex}`}>
              {renderInlineText(line.replace(/^[-•]\s+/, ''))}
            </li>
          ))}
        </ul>
      );
    }

    return (
      <p
        key={`p-${paragraphIndex}`}
        className="text-sm leading-6 text-slate-700 dark:text-slate-200 whitespace-pre-wrap"
      >
        {renderInlineText(paragraph)}
      </p>
    );
  });
};

const AIIntelligence = () => {
  const [messages, setMessages] = useState([
    {
      id: 'intro',
      role: 'assistant',
      content:
        'I can explain current demand, time-series patterns, anomalies, cluster behavior, and model performance using only the project’s existing EV charging data.',
      timestamp: createTimestamp()
    }
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [aiHealth, setAiHealth] = useState({
    connected: false,
    checked: false,
    message: 'Checking Gemini connection…',
    dataContext: 'Unavailable'
  });

  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // --------------------------------------------------
  // AI HEALTH CHECK
  // --------------------------------------------------
  const fetchHealth = async () => {
    try {
      const healthData = await api.getAiHealth();

      const connected = Boolean(healthData.available);

      setAiHealth({
        connected,
        checked: true,
        message: connected
          ? 'Gemini is connected and ready.'
          : 'AI engine is currently unavailable. Please try again.',
        dataContext: connected ? 'Available' : 'Unavailable'
      });
    } catch (err) {
      setAiHealth({
        connected: false,
        checked: true,
        message:
         'AI engine is currently unavailable. Please try again.',
        dataContext: 'Unavailable'
      });
    }
  };

  useEffect(() => {
    fetchHealth();

    const intervalId = setInterval(fetchHealth, 20000);

    return () => clearInterval(intervalId);
  }, []);

  // --------------------------------------------------
  // SEND AI MESSAGE
  // --------------------------------------------------
  const handleSend = async (overrideMessage) => {
    const messageText = (overrideMessage ?? input).trim();

    if (!messageText) {
      setError('Please enter a question before sending.');
      return;
    }

    if (!aiHealth.connected) {
      setError(
        'AI engine is currently unavailable. Please try again.'
      );
      return;
    }

    setLoading(true);
    setError('');

    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        role: 'user',
        content: messageText,
        timestamp: createTimestamp()
      }
    ]);

    setInput('');

    try {
      const response = await api.sendAiChat({
        message: messageText
      });

      if (!response?.success || !response?.answer) {
        throw new Error(
          response?.message || 'Unable to get an AI response.'
        );
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: response.answer,
          timestamp: createTimestamp(),
          contextSources: response.contextSources || []
        }
      ]);
    } catch (err) {
      setError(err.message || 'Unable to get an AI response.');

      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-error-${Date.now()}`,
          role: 'assistant',
          content: err.message || 'Unable to get an AI response.',
          timestamp: createTimestamp(),
          isError: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // ENTER KEY
  // --------------------------------------------------
  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  // --------------------------------------------------
  // CLEAR CHAT
  // --------------------------------------------------
  const clearConversation = () => {
    setMessages([
      {
        id: 'intro',
        role: 'assistant',
        content:
          'I can explain current demand, time-series patterns, anomalies, cluster behavior, and model performance using only the project’s existing EV charging data.',
        timestamp: createTimestamp()
      }
    ]);

    setError('');
  };

  const canSend =
    aiHealth.connected &&
    !loading &&
    input.trim().length > 0;

  return (
    <div className="space-y-8">
      {/* PAGE HEADER */}
      <PageHeader
        title="AI Intelligence"
        subtitle="Ask questions about EV charging demand, patterns, anomalies and ML results."
        badge="Local analysis layer"
      />

      {/* STATUS CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* AI ENGINE */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center justify-between gap-3">

            <div className="flex items-center gap-3">

              <div
                className={`p-2 rounded-xl ${
                  aiHealth.connected
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                }`}
              >
                {aiHealth.connected ? (
                  <Wifi className="w-5 h-5" />
                ) : (
                  <WifiOff className="w-5 h-5" />
                )}
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  AI Engine
                </p>

                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {aiHealth.connected
                    ? 'Connected'
                    : 'Unavailable'}
                </h3>
              </div>
            </div>

            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide ${
                aiHealth.connected
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
              }`}
            >
              Gemini
            </span>

          </div>

          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            {aiHealth.message}
          </p>
        </div>

        {/* DATA CONTEXT */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center justify-between gap-3">

            <div className="flex items-center gap-3">

              <div
                className={`p-2 rounded-xl ${
                  aiHealth.dataContext === 'Available'
                    ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
                    : 'bg-slate-500/10 text-slate-600 dark:text-slate-300'
                }`}
              >
                <BrainCircuit className="w-5 h-5" />
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  Data Context
                </p>

                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {aiHealth.dataContext}
                </h3>
              </div>

            </div>

            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide ${
                aiHealth.dataContext === 'Available'
                  ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
                  : 'bg-slate-500/10 text-slate-600 dark:text-slate-300'
              }`}
            >
              Grounded
            </span>

          </div>

          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            Context is built from the project’s existing summary,
            time-series, clustering, anomaly, model evaluation,
            and prediction datasets.
          </p>
        </div>

      </div>

      {/* QUICK ACTIONS */}
      <div className="glass-panel rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800/80">

        <div className="mb-4 flex items-center justify-between gap-3">

          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-500" />

            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Quick actions
            </h3>
          </div>

          <button
            onClick={clearConversation}
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
            type="button"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </button>

        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2">

          {QUICK_ACTIONS.map((action) => (
            <button
              key={action}
              type="button"
              onClick={() => handleSend(action)}
              disabled={loading || !aiHealth.connected}
              className="group text-left rounded-xl border border-slate-200/80 bg-slate-50/80 hover:bg-emerald-50 dark:border-slate-700/80 dark:bg-slate-900/60 dark:hover:bg-emerald-500/10 px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="flex items-center justify-between gap-2">

                <span>{action}</span>

                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-500" />

              </span>
            </button>
          ))}

        </div>
      </div>

      {/* CHAT AREA */}
      <div className="glass-panel rounded-3xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden">

        <div
          ref={scrollRef}
          className="h-[520px] overflow-y-auto p-4 sm:p-5 space-y-4"
        >

          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${
                message.role === 'user'
                  ? 'justify-end'
                  : 'justify-start'
              }`}
            >

              <div
                className={`max-w-[85%] rounded-2xl border p-3.5 shadow-sm ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-emerald-500/60'
                    : message.isError
                    ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-200 dark:border-rose-500/30'
                    : 'bg-slate-50 border-slate-200 dark:bg-slate-900/70 dark:border-slate-700/80 text-slate-700 dark:text-slate-100'
                }`}
              >

                {/* MESSAGE HEADER */}
                <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] opacity-80">

                  {message.role === 'user' ? (
                    <User className="w-3.5 h-3.5" />
                  ) : (
                    <Bot className="w-3.5 h-3.5" />
                  )}

                  <span>
                    {message.role === 'user'
                      ? 'You'
                      : 'EVCharge AI'}
                  </span>

                  <span className="ml-auto">
                    {message.timestamp}
                  </span>

                </div>

                {/* MESSAGE CONTENT */}
                <div
                  className={
                    message.role === 'user'
                      ? 'text-white'
                      : ''
                  }
                >
                  {renderMessageContent(message.content)}
                </div>

                {/* CONTEXT SOURCES */}
                {message.contextSources &&
                  message.contextSources.length > 0 && (
                    <div
                      className={`mt-3 rounded-xl border px-2.5 py-2 ${
                        message.role === 'user'
                          ? 'border-white/20 bg-white/5'
                          : 'border-slate-200 bg-white/60 dark:border-slate-700 dark:bg-slate-950/30'
                      }`}
                    >

                      <p
                        className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${
                          message.role === 'user'
                            ? 'text-emerald-100'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        Based on
                      </p>

                      <ul
                        className={`mt-1 flex flex-wrap gap-2 ${
                          message.role === 'user'
                            ? 'text-emerald-50'
                            : 'text-slate-600 dark:text-slate-300'
                        }`}
                      >

                        {message.contextSources.map((source) => (
                          <li
                            key={source}
                            className="text-xs rounded-full border px-2 py-1 border-current/20"
                          >
                            {contextLabelMap[source] || source}
                          </li>
                        ))}

                      </ul>

                    </div>
                  )}

              </div>

            </motion.div>
          ))}

          {/* LOADING */}
          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >

              <div className="max-w-[85%] rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/70 p-3.5 shadow-sm">

                <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  <Bot className="w-3.5 h-3.5" />
                  <span>EVCharge AI</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">

                  <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />

                  <span>
                    Analyzing charging data and model outputs…
                  </span>

                </div>

              </div>

            </motion.div>
          )}

        </div>

        {/* INPUT AREA */}
        <div className="border-t border-slate-200/80 dark:border-slate-800/80 p-3 sm:p-4">

          {error && (
            <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
              {error}
            </div>
          )}

          <div className="flex gap-3 items-end">

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your EV charging data..."
              rows={1}
              className="flex-1 resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500"
              disabled={!aiHealth.connected || loading}
            />

            <button
              type="button"
              onClick={() => handleSend()}
              disabled={!canSend}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:from-emerald-600 hover:to-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
            >

              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}

              <span>
                {loading ? 'Thinking' : 'Send'}
              </span>

            </button>

          </div>
        </div>

      </div>
    </div>
  );
};

export default AIIntelligence;