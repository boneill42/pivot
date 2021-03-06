var Q = require('q');
var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');

function mockDruid(port, options) {
  var app = express();
  app.disable('x-powered-by');

  app.get('/status', (req, res) => {
    Q(options.onStatus()).then(function (r) {
      res.status(r.status || 200).json(r.result);
    });
  });

  app.get('/druid/v2/datasources', (req, res) => {
    Q(options.onDataSources(req.body)).then(function (r) {
      res.status(r.status || 200).json(r.result);
    });
  });

  app.use(bodyParser.json());

  app.post('/druid/v2/', (req, res) => {
    Q(options.onQuery(req.body)).then(function (r) {
      res.status(r.status || 200).json(r.result);
    });
  });

  var server = http.createServer(app);

  server.on('error', (error) => {
    if (error.syscall !== 'listen') {
      throw error;
    }

    // handle specific listen errors with friendly messages
    switch (error.code) {
      case 'EACCES':
        console.error(`Port ${port} requires elevated privileges`);
        process.exit(1);
        break;

      case 'EADDRINUSE':
        console.error(`Port ${port} is already in use`);
        process.exit(1);
        break;

      default:
        throw error;
    }
  });

  var deferred = Q.defer();

  server.on('listening', () => {
    deferred.resolve(null);
  });

  app.set('port', port);
  server.listen(port);

  return deferred.promise;
}

module.exports = mockDruid;
