const RedisServer = require('redis-server');

// // Simply pass the port that you want a Redis server to listen on.
const server = new RedisServer(6379);

server.open().then(() => console.log('working'));