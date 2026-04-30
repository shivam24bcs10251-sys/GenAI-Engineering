require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const chatRouter = require('./routes/chat');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.use('/api', chatRouter);

// Catch-all: serve index.html for any unmatched GET (needed for Vercel / SPA routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
