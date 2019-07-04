const bluebird = require('bluebird');
const redis = require('redis');

bluebird.promisifyAll(redis);

const client = redis.createClient('redis://redistogo:bcce90f63040e833c17d4cc7743eab4d@hammerjaw.redistogo.com:10088/');

module.exports = client;