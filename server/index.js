require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');
const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
	res.json({ message: 'Boba server is running' });
});

app.get('/health', (req, res) => {
	res.json({ status: 'ok' });
});

//testing if DATABASE connection is working REMOVE AFTER
app.get('/health/db', async (req, res) => {
	try {
		await db.query('SELECT 1');
		res.json({ db: 'connected' });
	} catch (err) {
		console.error('DB health check failed:', err.message);
		res.status(500).json({ db: 'disconnected', error: err.message });
	}
});

app.use('/api/manager', require('./routes/manager'));
app.use('/api/cashier', require('./routes/cashier'));
app.use('/api/customer', require('./routes/customer'));
app.use('/api/menu', require('./routes/menu'));
app.use('/api/kitchen', require('./routes/kitchen'));
app.use('/api/assistant', require('./routes/assistant'));
app.use('/api/tts', require('./routes/tts'));

const PORT = Number(process.env.PORT) || 5000;
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
server.on('error', (err) => {
	if (err.code === 'EADDRINUSE') {
		console.error(
			`\nPort ${PORT} is already in use. On macOS, AirPlay Receiver often uses 5000.\n` +
				`Fix: set PORT=5001 (or another free port) in server/.env and set the same URL in client/.env as VITE_API_URL.\n`
		);
		process.exit(1);
	}
	throw err;
});
