const express = require('express');
const http = require('node:http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*", methods: ["GET", "POST", "PUT", "DELETE"], allowedHeaders: "*", credentials: true } });

app.use(cors({ origin: "*", methods: ["GET", "POST", "PUT", "DELETE"], allowedHeaders: "*", credentials: true }));
app.use(express.json());
app.use(express.static('public'));

let connectedClients = {};
let positions = [];

io.on('connection', (socket) => {
    console.log('New client connected');

    // Add client to connectedClients
    connectedClients[socket.id] = { id: socket.id, position: null };

    // Emit the current number of users and positions to the newly connected client
    socket.emit('initialData', { userCount: Object.keys(connectedClients).length, positions });

    // Listen for location updates from the client
    socket.on('updateLocation', (position) => {
        console.log(`Location from ${socket.id}:`, position);

        // Update the position of the client
        connectedClients[socket.id].position = position;

        // Update the positions array
        positions = Object.values(connectedClients).map(client => client.position).filter(pos => pos !== null);

        // Broadcast updated positions and user count
        io.emit('updateData', { userCount: Object.keys(connectedClients).length, positions });
    });

    // Handle client disconnection
    socket.on('disconnect', () => {
        console.log(`Client ${socket.id} disconnected`);

        // Remove the client from connectedClients
        delete connectedClients[socket.id];

        // Update the positions array
        positions = Object.values(connectedClients).map(client => client.position).filter(pos => pos !== null);

        // Broadcast updated positions and user count
        io.emit('updateData', { userCount: Object.keys(connectedClients).length, positions });
    });
});

const PORT = 6006;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});