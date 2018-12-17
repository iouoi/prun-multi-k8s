const keys = require('./keys');

// we'll have a couple different section
// Express App Setup
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());  // Cross origin resource sharing: allow us ot make requests from one domain that react app is running on to a completely different domain or port (where the Express API is hosted on)
app.use(bodyParser.json()); // parse incoming requests from the react app, and turn the body of the post request into JSON value that Express api can easily work with.

// Postgres Client Setup  (setup to create and connect to our postgres server)
const { Pool } = require('pg');
const pgClient = new Pool({
  user: keys.pgUser,
  host: keys.pgHost,
  database: keys.pgDatabase,
  password: keys.pgPassword,
  port: keys.pgPort,
});
pgClient.on('error', () => console.log('Lost PG connection'));

// create/initialize a table for postgres (SQL) 
pgClient
  // .on('connect', () => pgClient // surround 'create values' query in a .on('connect') listener
  .query('CREATE TABLE IF NOT EXISTS values (number INT)') // table named 'values', store a single column of info referred to as 'number' (the index)
  .catch((err) => console.log(err));

// Redix Client Setup
const redis = require('redis');
const redisClient = redis.createClient({
  host: keys.redisHost,
  port: keys.redisPort,
  retry_strategy: () => 1000
});
const redisPublisher = redisClient.duplicate();
// if you ever have a client that's listening or publishing info on redis, we have to make a duplicate connection because when a connection is turned into a connection that'll listen or subscribe or publish info, it cannot be used for other purposes.

// Express route handlers

app.get('/', (req, res) => {
  res.send('Hi');
});

// to query our running postgres instance and retrieve all values ever been submitted to postgres
app.get('/values/all', async (req, res) => {
  const values = await pgClient.query('SELECT * from values'); // from the 'values' table, pull all the info out of it
  res.send(values.rows);  // '.rows': only send back info retrieved from the database, and no other info that's contained inside the 'values' object (like some info about query itself)
});

app.get('/values/current', async (req, res) => {
  redisClient.hgetall('values', (err, values) => {
    res.send(values);
  });
  // 'hgetall': look at the hash value inside the redis instance, and just get all info from it
  // redis lib for node.js doesn't have promise support, so we're using callbacks (instead of async await syntax)
});

app.post('/values', async (req, res) => {
  const index = req.body.index;

  if (parseInt(index) > 40) {
    return res.status(422).send('Index too high');
  }

  // put the value into redis data store
  redisClient.hset('values', index, 'Nothing yet!'); // key:value pair : eventually, worker will come to the hash and replace that initial string with actual calculated value
  redisPublisher.publish('insert', index); // publish a new insert event of that index (this will be the message that gets sent over to the worker process, wake up worker process and say "it's time to pull a new value out of redis and start calculating a new Fib value for it")
  pgClient.query('INSERT INTO values(number) VALUES($1)', [index])  // add in the new index that was just submitted in Postgres   (we insert into 'number' column)

  res.send({ working: true });
});

app.listen(5000, err => {
  console.log('Listening');
});