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

connection.connect(function(err) {
  if (err) {
    console.error('error connecting: ' + err.stack);
    return;
  }

  console.log('connected as id ' + connection.threadId);
});

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(express.static(path.join(__dirname, 'public')));
app.get('/', function(req, res){
  connection.query('SELECT * FROM people', function(err, rows){
    res.render('index', {users : rows});
  });
});

app.get('/tracker/*',function(req,res){
  console.log(req.name);
  res.sendfile(path.join(__dirname, req.path);
});

module.exports = app;