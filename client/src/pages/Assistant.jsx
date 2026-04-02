import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const toApiUrl = (path) => `${API_BASE}${path}`;

const starterMessages = [
  {
    role: 'assistant',
    content: 'Hi, I can help with menu questions and ordering. Ask me about drinks, toppings, prices, or how to place an order.',
  },
];

const quickPrompts = [
  'What drinks do you have?',
  'What toppings are available?',
  'Help me place an order',
];

export default function Assistant() {
  const [messages, setMessages] = useState(starterMessages);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const chatMessages = useMemo(() => messages, [messages]);

  const sendMessage = async (prompt) => {
    const messageText = (prompt ?? input).trim();

    if (!messageText || loading) {
      return;
    }

    const nextMessages = [...messages, { role: 'user', content: messageText }];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);
    setError('');

    try {
      const response = await fetch(toApiUrl('/api/assistant/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages }),
      });

      if (!response.ok) {
        throw new Error('Assistant request failed');
      }

      const data = await response.json();

      setMessages((currentMessages) => [
        ...currentMessages,
        { role: 'assistant', content: data.reply },
      ]);
    } catch (err) {
      console.error(err);
      setError('The assistant could not respond right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <div style={styles.badge}>Personal Assistant</div>
          <h1 style={styles.title}>Reveille Boba Helper</h1>
        </div>
        <Link to="/" style={styles.backLink}>← Portal</Link>
      </header>

      <main style={styles.card}>
        <p style={styles.description}>
          Ask about menu items, toppings, pricing, or ordering steps.
        </p>

        <div style={styles.quickRow}>
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              style={styles.quickButton}
              onClick={() => sendMessage(prompt)}
            >
              {prompt}
            </button>
          ))}
        </div>

        <div style={styles.chatWindow}>
          {chatMessages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              style={{
                ...styles.message,
                ...(message.role === 'assistant' ? styles.assistantMessage : styles.userMessage),
              }}
            >
              {message.content}
            </div>
          ))}
          {loading && <div style={{ ...styles.message, ...styles.assistantMessage }}>Thinking...</div>}
        </div>

        {error && <p style={styles.error}>{error}</p>}

        <form
          style={styles.form}
          onSubmit={(event) => {
            event.preventDefault();
            sendMessage();
          }}
        >
          <input
            style={styles.input}
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask something about the menu or ordering..."
          />
          <button style={styles.sendButton} type="submit" disabled={loading}>
            Send
          </button>
        </form>
      </main>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #fdf6ec 0%, #f8efe1 100%)',
    color: '#4a2c0a',
    fontFamily: "'Georgia', serif",
    padding: '1.5rem',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  badge: {
    display: 'inline-block',
    padding: '0.35rem 0.75rem',
    borderRadius: '999px',
    background: '#fff',
    border: '1px solid #e8d5b7',
    fontSize: '0.85rem',
    marginBottom: '0.5rem',
  },
  title: {
    margin: 0,
    fontSize: '2rem',
  },
  backLink: {
    textDecoration: 'none',
    color: '#4a2c0a',
    background: '#fff',
    border: '1px solid #e8d5b7',
    borderRadius: '999px',
    padding: '0.55rem 1rem',
    fontWeight: 'bold',
  },
  card: {
    maxWidth: '900px',
    margin: '0 auto',
    background: '#fff',
    borderRadius: '24px',
    padding: '1.5rem',
    boxShadow: '0 12px 30px rgba(74, 44, 10, 0.12)',
    border: '1px solid #e8d5b7',
  },
  description: {
    marginTop: 0,
    color: '#6b4b2c',
  },
  quickRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.75rem',
    marginBottom: '1rem',
  },
  quickButton: {
    border: '1px solid #e8d5b7',
    background: '#fdf6ec',
    color: '#4a2c0a',
    borderRadius: '999px',
    padding: '0.55rem 0.9rem',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  chatWindow: {
    minHeight: '360px',
    maxHeight: '520px',
    overflowY: 'auto',
    border: '1px solid #f0e0cc',
    borderRadius: '18px',
    padding: '1rem',
    background: '#fffdf9',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  message: {
    maxWidth: '80%',
    padding: '0.85rem 1rem',
    borderRadius: '16px',
    lineHeight: 1.45,
    whiteSpace: 'pre-wrap',
  },
  assistantMessage: {
    background: '#f3e6d8',
    alignSelf: 'flex-start',
  },
  userMessage: {
    background: '#4a2c0a',
    color: '#fff',
    alignSelf: 'flex-end',
  },
  error: {
    color: '#b00020',
    fontWeight: 'bold',
  },
  form: {
    display: 'flex',
    gap: '0.75rem',
    marginTop: '1rem',
  },
  input: {
    flex: 1,
    borderRadius: '999px',
    border: '1px solid #d8c1a5',
    padding: '0.9rem 1rem',
    fontSize: '1rem',
    fontFamily: 'inherit',
  },
  sendButton: {
    border: 'none',
    borderRadius: '999px',
    background: '#c8773a',
    color: '#fff',
    padding: '0.9rem 1.4rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
};