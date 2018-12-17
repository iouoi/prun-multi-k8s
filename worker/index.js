const keys = require('./keys');
const redis = require('redis');

const redisClient = redis.createClient({
  host: keys.redisHost,
  port: keys.redisPort,
  retry_strategy: () => 1000
});
const sub = redisClient.duplicate();

function fib(index) {
  if (index < 2) return 1;
  return fib(index - 1) + fib(index - 2);
}

sub.on('message', (channel, message) => {
  redisClient.hset('values', message, fib(parseInt(message)));
  // any time we get a new value that shows up in redis, we calculate a new Fib value, and insert that into a hash called 'values'. Key will be 'message', which will be the index value that was submitted into our form. We push in the value for Fib sequence we just calculated as the value (of key:value pair)
});
sub.subscribe('insert'); // subscribe to 'insert' event