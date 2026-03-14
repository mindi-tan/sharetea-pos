require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/manager', require('./routes/manager'));
app.use('/api/cashier', require('./routes/cashier'));
app.use('/api/customer', require('./routes/customer'));
app.use('/api/menu', require('./routes/menu'));
app.use('/api/kitchen', require('./routes/kitchen'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
