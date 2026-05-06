// load env
require('dotenv').config();

// imports
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

// app init
const app = express();

// middleware
app.use(cors());
app.use(express.json());

// root route: serve the React app
app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// health route
app.get('/health', (req, res) => {
	// send status
	res.json({ status: 'ok' });
});

// db health route
app.get('/health/db', async (req, res) => {
	try {
		// test query
		await db.query('SELECT 1');

		// success
		res.json({ db: 'connected' });
	} catch (err) {
		// log error
		console.error('DB health check failed:', err.message);

		// fail response
		res.status(500).json({ db: 'disconnected', error: err.message });
	}
});

// routes
app.use('/api/manager', require('./routes/manager'));
app.use('/api/cashier', require('./routes/cashier'));
app.use('/api/customer', require('./routes/customer'));
app.use('/api/menu', require('./routes/menu'));
app.use('/api/kitchen', require('./routes/kitchen'));
app.use('/api/assistant', require('./routes/assistant'));
app.use('/api/translate', require('./routes/translate'));

// serve static client files
app.use(express.static(path.join(__dirname, '../client/dist')));

// SPA fallback: serve index.html for all non-API routes
app.get('*', (req, res) => {
	const filePath = path.join(__dirname, '../client/dist/index.html');
	res.sendFile(filePath, (err) => {
		if (err) {
			console.error('Error serving index.html:', err.message);
			res.status(500).json({ error: 'Client build not found. Ensure client was built before deployment.' });
		}
	});
});

// port set
const PORT = Number(process.env.PORT) || 5000;

// start server
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// error handler
server.on('error', (err) => {
	// port used
	if (err.code === 'EADDRINUSE') {
		// show fix
		console.error(
			`\nPort ${PORT} is already in use. On macOS, AirPlay Receiver often uses 5000.\n` +
				`Fix: set PORT=5001 (or another free port) in server/.env and set the same URL in client/.env as VITE_API_URL.\n`
		);

		// exit app
		process.exit(1);
	}

	// other errors
	throw err;
});