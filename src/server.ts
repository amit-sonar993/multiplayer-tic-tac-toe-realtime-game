import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import setupSocketIO from './sockets';

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = 3000;


app.use(express.static('public'));

// Setup socket events
setupSocketIO(io);



// Start the server
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
