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

    connectedClients[socket.id] = { id: socket.id, position: null };

    console.log(Object.keys(connectedClients).length);
    socket.emit('initialData', { userCount: Object.keys(connectedClients).length, positions });
    console.log('emmited data');

    // Listen on the new position from the webapp
    socket.on('updateLocation', (position) => {
        console.log(`Location from ${socket.id}:`, position);

        connectedClients[socket.id].position = position;

        positions = Object.values(connectedClients).map(client => client.position).filter(pos => pos !== null);

        io.emit('updateData', { userCount: Object.keys(connectedClients).length, positions });
        console.log('update data')
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