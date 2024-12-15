import express from 'express';
import routes from './routes/index'; // Import routes from routes/index.js
import { PORT } from './config';

const app = express();

// Middleware to parse JSON requests
app.use(express.json({ limit: '2gb' }));

// Load all routes from the routes directory
app.use(routes);

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}/`);
});
