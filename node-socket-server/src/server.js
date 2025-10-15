import app from './app.js';
import mongoose from 'mongoose';
import { createClient } from 'redis';
import http from 'http';

const PORT = process.env.PORT;

//CREATING HTTP SERVER
const server = http.createServer(app);

//CONNECTING TO REDIS
export const redisClient = createClient({url:process.env.REDIS_URL});
redisClient.on('error', err => console.error('Redis Client Error', err));
await redisClient.connect(); // Connect asynchronously

// CONECTING TO MONGO DATABSE 
mongoose.connect(process.env.MONGO_URL)
    .then(() => console.log("MongoDB connected successfully!"))
    .catch(err => console.error(err));

// STARTS THE SERVER
server.listen(PORT,()=>{
    console.log(`Server running on http://localhost:${PORT}/`)
})