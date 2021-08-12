const restify = require('restify');
const dal = require('./data-access-layer');
const mongoose = require('mongoose');
const responseTime = require('response-time')
const redis = require('redis');

const client = redis.createClient();

function respond(req, res, next) {
  res.send('hello ' + req.params.name);
  next();
}

var server = restify.createServer();
server.use(restify.plugins.bodyParser());

server.get('/hello/:name', respond);
server.head('/hello/:name', respond);

server.get('/menu/:restaurantId', async function (req, res) {
  if (req.params.restaurantId) {
    client.get(req.params.restaurantId, (err, res) => {
      if (result) {
        res.send(result);
      } else {
        let processor = [];
        processor.push(dal.getRestaurantById(req.params.restaurantId));
        processor.push(dal.getRestaurantMenuByRestaurantId(req.params.restaurantId));
        Promise.all(processor).then(resp => {
          let resp1 = {
            restaurantDetails: resp[0],
            menu: resp[1]
          };
          client.setex(req.params.restaurantId, 3600, JSON.stringify(resp1));
          res.send(resp1);
        });
      }
    });
  } else {
    res.send([]);
  }
});

server.post('/search', async function (req, res) {
  const requestBody = req.body;
  let filterArr = [];
  let filters = {};
  if (!requestBody) {
    res.send([]);
    return;
  }
  if (requestBody.name) {
    filterArr.push({ 'name': { '$regex': requestBody.name + '*' } });
  }
  if (requestBody.city) {
    filterArr.push({ 'location.city': requestBody.city });
  }
  if (requestBody.state) {
    filterArr.push({ 'location.state': requestBody.state });
  }
  if (requestBody.cuisine) {
    filterArr.push({ 'cuisine': requestBody.cuisine });
  }
  if (filterArr.length == 0) {
    res.send([]);
    return;
  } else if (filterArr.length == 1) {
    filters = filterArr[0];
  } else {
    filters = { $and: filterArr }
  }
  console.log(JSON.stringify(filters));
  await dal.getRestaurant(filters).then(rest => {
    res.send(rest);
  });
});



//Set up default mongoose connection
var mongoDB = '';
var connection = mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true }).then(() => {
  console.log('successfully connected.');

  //start the server once db is connected
  server.listen(8080, function () {
    console.log('%s listening at %s', server.name, server.url);
  });
});

//Get the default connection
var db = mongoose.connection;

//Bind connection to error event (to get notification of connection errors)
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// dal.getRestaurant({'location.state':'Ohio'});
// dal.getRestaurant({name: 'Medhurst - Rau'});
