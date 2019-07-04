const http = require('http');
const io = require('socket.io')();
const socketAuth = require('socketio-auth');
const adapter = require('socket.io-redis');

const redis = require('./redis');

const PORT = process.env.PORT || 9000;
const server = http.createServer();

const redisAdapter = adapter('redis://redistogo:bcce90f63040e833c17d4cc7743eab4d@hammerjaw.redistogo.com:10088/');

io.attach(server);
io.adapter(redisAdapter);

async function verifyUser(token) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const users = [
        {
          id: 1,
          name: 'John',
          token: 'secret token'
        }
      ];

      const user = users.find((user) => user.token === token);

      if (!user) {
        return reject('USER_NOT_FOUND');
      }

      return resolve(user);
    }, 200);
  });
}

socketAuth(io, {
  authenticate: async (socket, data, callback) => {
    const { token } = data;

    try {
      const user = await verifyUser(token);
      const canConnect = await redis
        .setAsync(`user:${user.id}`, socket.id, 'NX', 'EX', 30);

      if (!canConnect) {
        return callback({ message: 'ALREADY_LOGGED_IN' });
      }

      socket.user = user;

      return callback(null, true);
    } catch (e) {
      console.log(`Socket ${socket.id} unauthorized.`);
      return callback({ message: 'UNAUTHORIZED' });
    }
  },
  postAuthenticate: async (socket) => {
    console.log(`Socket ${socket.id} authenticated`);

    socket.conn.on('packet', async (packet) => {
      if (socket.auth && packet.type == 'ping') {
        await redis.setAsync(`users:${socket.user.id}`, socket.id, 'XX', 'EX', 30);
      }
    });
  },
  disconnect: async (socket) => {
    console.log(`Socket ${socket.id} disconnected`);

    if (socket.user) {
      await redis.delAsync(`users:${socket.user.id}`);
    }
  }
});

server.listen(PORT);