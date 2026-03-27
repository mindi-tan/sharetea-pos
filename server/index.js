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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
