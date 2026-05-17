const express = require('express');
const cors = require('cors');

const publicRoutes = require('./routes/public.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();

app.use(cors());
app.use(express.json());

// app.use(cors({
//   origin: [
//     'http://localhost:4200',
//     'https://YOUR-FRONTEND-DOMAIN.com'
//   ]
// }));

// routes
app.use('/api', publicRoutes);
app.use('/api/admin', adminRoutes);

// ping (for Render)
app.get('/ping', (req, res) => res.send('OK'));

module.exports = app;