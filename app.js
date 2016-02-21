/////////////////
// SETUP
/////////////////

var express = require('express');
var bodyParser = require("body-parser");
var path = require('path');
var mysql = require('mysql');
var multer = require('multer');
var csv = require("fast-csv");
var AWS = require('aws-sdk');
var fs = require('fs-extra');
var favicon = require('serve-favicon');
var base32 = require('base32');
var moment = require('moment');
var moment = require('moment-timezone');
var basicAuth = require('basic-auth-connect');
var app = express();

//Here we are configuring express to use body-parser as middle-ware.
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(favicon(__dirname + '/public/favicon.ico'));

// basic auth (unsecure)
var auth = basicAuth('charlie', 'candymountain');

/////////////////
// EMAIL STUFF
/////////////////
var ses = new AWS.SES({region: 'us-west-2'});

var createSESObject = function(subject, html, text, recipient, sender) {

  var params = {
    Destination: {
      ToAddresses: [
        recipient,
      ]
    },
    Message: { 
      Body: { 
        Html: {
          Data: html, 
        },
        Text: {
          Data: text, 
        }
      },
      Subject: { 
        Data: subject,
      }
    },
    Source: sender
  };

  return params;

}
/////////////////
// VIEWS
/////////////////

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

/////////////////
// DATABASE STUFF
/////////////////

var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'root',
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
    if (!result.length) {
      var tableCreationQuery = 'CREATE TABLE people(id int primary key AUTO_INCREMENT, name varchar(255), email varchar(255), std varchar(255), invitation varchar(255), rsvp varchar(255));';
      connection.query(tableCreationQuery, function(err, result) {
        if (err) throw err
        return;
      });
    }
  });
});

app.post('/admin/api/delete', auth, function(req, res){
  var objKeys = Object.keys(req.body);

  var identifier = function() {
    var finalString = "";
    for(var i=0; i < objKeys.length; i++) {
      finalString = finalString + objKeys[i] + "=\'" + req.body[objKeys[i]] + "\'";
    }
    return finalString;
  };
  var deleteQuery = "DELETE FROM people WHERE " + identifier() + ";";

  connection.query(deleteQuery, function(err, result){
    if (err) {
      res.send(500);
      console.log(err);
    } else {
      console.log(result);
      res.send(JSON.stringify({ success: "yes", data: result }));
    }
  });

});

// Database Integrity
app.get('/admin/db/check', auth, function(req, res){
  var connectionid = connection.threadId;
  var columns;
  var desiredcolumns = [
    'id',
    'name',
    'email',
    'std',
    'invitation',
    'rsvp',
    'passcode',
    'additional_spots',
    'meal_choices'
  ];
  var error;

  if (!connectionid) {
    connectionid = 'null connection. DB is not connected.';
  } else {
    var columnQuery = "SHOW COLUMNS FROM people;";
    connection.query(columnQuery, function(err, result){
      if (err) {
        res.render('dbcheck', {connectionid: connectionid, columns: result, error: err});
      }
      if (result) {
        res.render('dbcheck', {connectionid: connectionid, columns: result});
      }
    });
  }
});

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
            console.log('Adding ' + newGuest.name + ' to database.');
          });
        } else {
          console.log(newGuest.name + ' is already in the database.');
        }
      });
    })
    .on("end", function(){
      res.redirect('/admin/stage');
    });

});

app.get('/admin/stage', auth, function(req, res){
  connection.query('SELECT * FROM people', function(err, rows){
    res.render('stage', {recipients: rows});
  }); 
});

// route to serve tracker image
app.get('/tracker/*',function(req,res){
  var trackerArray = base32.decode(req.path.split('.')[0].split('\/tracker\/')[1]).split("|");
  var now = new Date();
  var timeString = moment(now).tz("America/Los_Angeles").format("M/DD hA") + "<br />Opened"
  console.log(trackerArray);
  if((trackerArray[1] == "std") || (trackerArray[1] == "invitation")){
    var trackingQuery = "UPDATE people SET " + trackerArray[1] + " = '" + timeString + "' WHERE email = '" + trackerArray[0] + "';";
    connection.query(trackingQuery, function(err, result) {
      console.log(result);
      if (err) throw err
    });
  }

  res.sendfile(path.join(__dirname, req.path));
});

/////////////////
// PREVIEW
/////////////////

// tracked emails
var imageUpload = multer({
  dest: 'public/images/',
  limits: {fileSize: 50000000, files:1},
});

app.post('/admin/stage/preview', imageUpload.single('image'), function(req, res, next) { 
  var tmpHtml = req.body.html_area;
  var subject = req.body.subject;
  if (req.file){
    var tmpFile = req.file.filename;
    var imgTag = '<img src=\'http://yuanamarry.me/images/' + tmpFile + '\' style="max-width: 100%;"/>';
    tmpHtml = tmpHtml.replace(/\|\!IMAGE\!\|/g, imgTag);
  }

  res.render('preview', {tmpHtml: tmpHtml, subject: subject});

});

app.get('/admin/api/sendees', auth, function(req, res){
  if (req.query.type === 'std') {
    connection.query('SELECT * FROM people WHERE std = \'Not Yet\'', function(err, rows){
      res.json(rows);
    });
  } else if (req.query.type === 'invitation') {
    connection.query('SELECT * FROM people WHERE invitation = \'Not Yet\'', function(err, rows){
      res.json(rows);
    });
  } else {
    connection.query('SELECT * FROM people', function(err, rows){
      res.json(rows);
    });
  }
});

app.post('/admin/api/sendemail', auth, function(req, res){
  var timestamp = new Date();
  var newTrackerName = base32.encode(req.body.email + "|" + req.body.emailType + "|" + timestamp + "|" + req.body.subject);

  // Add tracker gif
  fs.copy(path.join(__dirname, 'tracker/tracker.png'), path.join(__dirname, 'tracker/' + newTrackerName + ".png"), function (err) {
    if (err) return console.error(err)
  });

  var recipient = req.body.email;
  var html = req.body.html + "<img src='http://yuanamarry.me/tracker/" + newTrackerName + ".png' />";
  var subject = req.body.subject;

  var sesObject = createSESObject(subject, html, html, recipient, 'no-reply@yuanamarry.me');

  ses.sendEmail(sesObject, function(err, data) {
    if (err) {
      res.send(500).send({ error: "SES failure: " + err });
      console.log("email failed to send to " + recipient);
    } else {
      console.log("email sent to " + recipient);
      if((req.body.emailType == "std") || (req.body.emailType == "invitation")){
        var now = new Date();
        var sentString = moment(now).tz("America/Los_Angeles").format("M/DD hA") + "<br />Sent"
        var trackingQuery = "UPDATE people SET " + req.body.emailType + " = '" + sentString + "' WHERE email = '" + req.body.email + "';";
        console.log(trackingQuery);
        connection.query(trackingQuery, function(err, result) {
          if (err) throw err
          console.log(result);
        });
      }
      res.send(JSON.stringify({ success: "yes", data: data }));
    }
  });

});

/////////////////
// HOME PAGE
/////////////////

app.get('/', function(req, res){
  res.render('index');
});

app.get('/homepage', auth, function(req, res){
  res.render('index-lock');
});


module.exports = app;