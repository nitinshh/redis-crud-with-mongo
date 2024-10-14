/*
in linux(ubuntu) terminal

sudo apt-get update    -- only when you trying it for the first time
sudo apt-get install redis-server   --- to install



sudo service redis-server start -- to start the server
sudo service redis-server status --- you should see  Active: active (running)

sudo service redis-server stop  -- to stop the server



redis-cli

Verify Redis is running by typing redis-cli and running:
ping
You should see PONG.



-------------------------------------------------


after starting the server and add some data



KEYS user:*                (to see all the users created with id)

HGETALL user:1                (to access the user with id 1)

*/

const express = require('express');
const redis = require('redis');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const PORT = process.env.PORT || 3000;
const app = express();
app.use(express.json());

// Redis client setup for Redis v4+
const redisClient = redis.createClient({
    url: `redis://${process.env.REDIS_HOST || '127.0.0.1'}:${process.env.REDIS_PORT || 6379}`
});

// Connect to Redis
redisClient.on('error', (err) => {
    console.log('Redis error: ', err);
});
(async () => {
    await redisClient.connect();
})();


mongoose.connect('mongodb://localhost:27017/redis')
.then(() => console.log('Connected to MongoDB...'))
.catch(err => console.error('Could not connect to MongoDB:', err));


const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
