const { Server } = require('socket.io');

let io;

const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.NODE_ENV === 'production' ? 'https://votre-domaine-production.com' : 'http://localhost:5173',
            methods: ['GET', 'POST'],
            credentials: true,
        }
    });

    io.on('connection', (socket) => {
        console.log(`Un client est connecté: ${socket.id}`);

        // On peut faire rejoindre les admins à une room spéciale pour ne notifier qu'eux
        socket.on('join_admin', () => {
            socket.join('admins');
            console.log(`Socket ${socket.id} a rejoint la room admins`);
        });

        socket.on('disconnect', () => {
            console.log(`Un client s'est déconnecté: ${socket.id}`);
        });
    });

    return io;
};

const getIo = () => {
    if (!io) {
        throw new Error("Socket.io n'est pas initialisé");
    }
    return io;
};

module.exports = { initSocket, getIo };
