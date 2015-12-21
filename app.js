/////////////////
// SETUP
/////////////////

var express = require('express');
var path = require('path');
var mysql = require('mysql');
var multer = require('multer');
var csv = require("fast-csv");
var basicAuth = require('basic-auth-connect');
var app = express();

/////////////////
// SETUP EMAIL
/////////////////
var ImapServer = require('imap-server');
var server = ImapServer();
 
// use plugin 
var plugins = require('imap-server/plugins');
server.use(plugins.announce);
/* use more builtin or custom plugins... */
 
var net = require('net');
net.createServer(server).listen(process.env.IMAP_PORT || 143);

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

  var tableExistsQuery = "SHOW TABLES LIKE 'people'";

  connection.query(tableExistsQuery, function(err, result){
    console.log(result);
    if (!result.length) {
      var tableCreationQuery = 'CREATE TABLE people(id int primary key AUTO_INCREMENT, name varchar(255), email varchar(255), std varchar(255), invitation varchar(255), rsvp varchar(255));';
      connection.query(tableCreationQuery, function(err, result) {
        if (err) throw err
        return;
      });
    }
  });
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

// Guest Object
var Guest = function(name, email, std, invitation, rsvp){
  this.name = name;
  this.email = email;
  this.std = std;
  this.invitation = invitation;
  this.rsvp = rsvp;
};


// basic auth (unsecure)
var auth = basicAuth('charlie', 'candymountain');

// tracking results
app.get('/admin/tracking', auth, function(req, res){
  connection.query('SELECT * FROM people', function(err, rows){
    res.render('tracking', {users : rows});
  });
});

// tracked emails
var upload = multer({
  dest: 'public/uploads/',
  limits: {fileSize: 500000, files:1},
});

var testRecipient = { name: 'Jason', email: 'jason@jason.com', std: 'Sent', invitation: 'Not Sent', rsvp: 'None' };
var recipients = [testRecipient];

app.post('/admin/stage', upload.single('csvfile'), function(req, res, next) { 
  var tmpFile = req.file.filename;

  csv
   .fromPath('public/uploads/' + tmpFile)
   .on("data", function(data){
      var guestName = data[0];
      var guestEmail = data[1];
      var newGuest = new Guest(guestName, guestEmail, "Not Yet", "Not Yet", "Not Yet");
      var query = 'SELECT * FROM people WHERE email=\'' + guestEmail + '\';';

      connection.query(query, function(err, rows){
        if (!rows.length){
          var insertQuery = 'INSERT INTO people (name, email, std, invitation, rsvp) VALUES (?, ?, ?, ?, ?);';
          connection.query(insertQuery, [newGuest.name, newGuest.email, newGuest.std, newGuest.invitation, newGuest.rsvp], function(err, result) {
            if (err) throw err

          });
        } else {
          console.log(newGuest.name + ' is already in the database.');
        }
      });
   });

  connection.query('SELECT * FROM people', function(err, rows){
    res.render('stage', {recipients: rows});
  }); 

});

app.get('/admin/stage', auth, function(req, res){
  connection.query('SELECT * FROM people', function(err, rows){
    res.render('stage', {recipients: rows});
  }); 
});

// route to serve tracker image
app.get('/tracker/*',function(req,res){
  res.sendfile(path.join(__dirname, req.path));
});

module.exports = app;