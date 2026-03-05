const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const formationsRouter = require('./src/routes/formations');
const playsRouter = require('./src/routes/plays');
const assignmentsRouter = require('./src/routes/assignments');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Serve static frontend files from /public
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.use('/api/formations', formationsRouter);
app.use('/api/plays', playsRouter);
app.use('/api/assignments', assignmentsRouter);

// Root route serves the main HTML page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

