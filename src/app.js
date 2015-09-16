var express = require('express');
var app = express();

var routes = require('./routes/index.js');
var send = require('./routes/send.js');

app.use('/', routes);

app.use('/send', send);

var server = app.listen(3000, function() {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Notifly listening at http://%s:%s', host, port);
});
