import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { registerRoomHandlers } from './socket-handlers.js';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// Serve static files from the root directory
app.use(express.static(rootDir));

const bootId = Date.now().toString();

// Socket coordination
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Send boot ID to client so they can detect restarts
    socket.emit('server:init', { bootId });

    registerRoomHandlers(io, socket);

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 3001;

function getLocalIp() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

console.log(`Starting server on port ${PORT}...`);
httpServer.listen(PORT, '0.0.0.0', () => {
    const localIp = getLocalIp();
    console.log(`
🚀 Scribble Squad Server Live!
🌍 Local:   http://localhost:${PORT}
🏠 Network: http://${localIp}:${PORT}

Crew members on your WiFi can join at the Network URL!
    `);
});

httpServer.on('error', (e) => {
    console.error('Server failed to start:', e);
});
