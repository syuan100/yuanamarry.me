var express = require('express');
var path = require('path');
var mysql = require('mysql');
var app = express();

var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'callwetip1',
  database : 'test_database'
});

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res){
  connection.query('SELECT * FROM people', function(err, rows){
    res.render('index', {users : rows});
  });
});

app.get('/track', function(req, res) {
  var name = req.param('name');
  var time = new Date()
  // time = time.toString();
  var useragent = req.headers['user-agent'];

  connection.query('INSERT INTO people (name, age, address) VALUES (?, ?, ?)', [name, time, useragent], function(err, result) {
      if (err) throw err
    }); 

});

module.exports = app;