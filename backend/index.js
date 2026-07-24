const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const http = require('http');
const helmet = require('helmet');
const { initSocket } = require('./socket');
const connectDB = require('./config/database');
const authRoutes = require('./routes/authRoutes');

const complaintRoutes = require('./routes/complaintRoutes');
const userRoutes = require('./routes/userRoutes');
const statsRoutes = require('./routes/statsRoutes');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const startCronJobs = require('./utils/cronTasks');
startCronJobs();

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// Security Middleware
app.use(helmet());

// CORS Configuration
const corsOptions = {
    origin: process.env.NODE_ENV === 'production'
        ? (process.env.FRONTEND_URL || '*')
        : 'http://localhost:5173',
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json()); // Body parser

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stats', statsRoutes);

// Servir les fichiers uploadés statiquement
const uploadsPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath);
}
app.use('/uploads', express.static(uploadsPath));

// Health check endpoint
app.get('/', (req, res) => {
    res.json({ message: "Bienvenue sur l'API de Wakalati SEAAL" });
});

const { errorHandler, notFound } = require('./middleware/errorHandler');

// Middleware for 404
app.use(notFound);

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`🚀 Serveur en cours d'exécution sur le port ${PORT}`);
});
