import express from 'express';
import routes from './routes/index.js';  // Import routes from routes/index.js

const app = express();

// Get the port from the environment variable or default to 5000
const PORT = process.env.PORT || 5000;

// Middleware to parse JSON requests
app.use(express.json());

// Load all routes from the routes directory
app.use(routes);

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port http://localhost:${PORT}/`);
});
