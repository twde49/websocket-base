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

/**
 * Handles events for a newly connected socket client.
 * 
 * This function manages client connections and communication between the server and connected clients. It performs the following actions:
 * 
 * 1. Adds the connected client's socket ID and initializes their data in `connectedClients`.
 * 2. Emits the initial data to the connected client, including the total number of users and their positions.
 * 3. Listens for updates to the client's location data via the `updateLocation` event:
 *    - Updates the `position` property of the client in `connectedClients`.
 *    - Retrieves the updated list of positions from all connected clients.
 *    - Broadcasts the new `positions` and user count to all connected clients via the `updateData` event.
 * 4. Handles disconnections through the `disconnect` event:
 *    - Removes the client from `connectedClients`.
 *    - Updates the list of positions and broadcasts the updates to all remaining clients.
 * 
 * Events:
 * - `initialData`: Emitted to the newly connected client with the following data:
 *   - `userCount` (number): The total number of connected clients.
 *   - `positions` (Array): A list of positions for all clients, excluding null positions.
 * - `updateLocation`: Listened for updates to the client's position. Expects:
 *   - `position` (object): Data representing the client's updated position.
 * - `updateData`: Broadcast to all clients upon receiving `updateLocation` or during a disconnection. Includes:
 *   - `userCount` (number): The updated number of connected clients.
 *   - `positions` (Array): The updated list of client positions.
 */
io.on('connection', (socket) => {
    connectedClients[socket.id] = { id: socket.id, position: null };

    console.log(Object.keys(connectedClients).length);
    socket.emit('initialData', { userCount: Object.keys(connectedClients).length, positions });
    console.log('emmited data');

    socket.on('updateLocation', (position) => {
        console.log(`Location from ${socket.id}:`, position);

        connectedClients[socket.id].position = position;

        positions = Object.values(connectedClients).map(client => client.position).filter(pos => pos !== null);

        io.emit('updateData', { userCount: Object.keys(connectedClients).length, positions });
        console.log('update data')
    });

    /**
     * Handles the disconnection of a client from the server.
     *
     * This function is triggered when a connected client disconnects. It performs
     * the following actions:
     * 1. Logs the disconnection event with the client's socket ID.
     * 2. Removes the disconnected client from the `connectedClients` object.
     * 3. Updates the list of positions by filtering out null positions
     *    from the remaining connected clients.
     * 4. Emits an event to all connected clients to update data, including
     *    the current count of connected users and their positions.
     *
     * Emitted Event:
     * - `updateData`:
     *   - `userCount` (number): The total number of currently connected users.
     *   - `positions` (Array): A list of non-null positions for all connected users.
     */
    socket.on('disconnect', () => {
        console.log(`Client ${socket.id} disconnected`);

        delete connectedClients[socket.id];

        positions = Object.values(connectedClients).map(client => client.position).filter(pos => pos !== null);

        io.emit('updateData', { userCount: Object.keys(connectedClients).length, positions });
    });
});


app.get('/remove-websockets', (req, res) => {
  /**
   * Disconnects the provided socket forcefully from the server.
   *
   * @param {Object} socket - The socket instance to disconnect.
   */
  io.of('/').sockets.forEach((socket) => {
    socket.disconnect(true);
  });
  res.status(200).send('All WebSocket instances removed');
});

const PORT = 6006;
/**
 * Logs a message to the console indicating that the server is running on a specific port.
 * The port number is retrieved from the variable `PORT`.
 */
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});