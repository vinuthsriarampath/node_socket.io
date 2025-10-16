import app from './app.js';
import mongoose from 'mongoose';
import { createClient } from 'redis';
import http from 'http';
import { Server } from 'socket.io';
import ChatSocket from './sockets/chat-socket.js';

const PORT = process.env.PORT;

//CREATING HTTP SERVER
const server = http.createServer(app);

//CONNECT TO SOCKET.IO
const io = new Server(server, { cors: { origin: process.env.FRONTEND_URL }});
ChatSocket(io);

//CONNECTING TO REDIS
export const redisClient = createClient({url:process.env.REDIS_URL});
redisClient.on('error', err => console.error('Redis Client Error', err));
await redisClient.connect(); // Connect asynchronously

// CONNECTING TO MONGO DATABASE
mongoose.connect(process.env.MONGO_URL)
    .then(() => console.log("MongoDB connected successfully!"))
    .catch(err => console.error(err));

// STARTS THE SERVER
server.listen(PORT,()=>{
    console.log(`Server running on http://localhost:${PORT}/`)
})