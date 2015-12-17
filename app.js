/////////////////
// SETUP
/////////////////

var express = require('express');
var path = require('path');
var mysql = require('mysql');
var basicAuth = require('basic-auth-connect');
var app = express();

/////////////////
// DATABASE STUFF
/////////////////

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

/////////////////
// VIEWS
/////////////////

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

/////////////////
// STATIC FILES
/////////////////

app.use(express.static(path.join(__dirname, 'public')));

/////////////////
// TRACKER LOGIC
/////////////////

// basic auth (unsecure)
var auth = basicAuth('charlie', 'candymountain');

// tracking results
app.get('/tracking', auth, function(req, res){
  connection.query('SELECT * FROM people', function(err, rows){
    res.render('tracking', {users : rows});
  });
});

// route to serve tracker image
app.get('/tracker/*',function(req,res){
  res.sendfile(path.join(__dirname, req.path));
});

module.exports = app;