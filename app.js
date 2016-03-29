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
var randomstring = require('randomstring');
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
    'meal_choices',
    'used_spots'
  ];
  var error;

  if (!connectionid) {
    connectionid = 'null connection. DB is not connected.';
  } else {
    var columnQuery = "SHOW COLUMNS FROM people;";
    var fullListQuery = "SELECT * FROM people;";
    connection.query(columnQuery, function(err, result){
      if (err) {
        res.render('dbcheck', {connectionid: connectionid, columns: result, error: err});
      }
      if (result) {
        connection.query(fullListQuery, function(err, fullList){
          if(err){
            console.log(err);
          }
          if(fullList) {
            console.log(fullList[0]);
            res.render('dbcheck', {connectionid: connectionid, columns: result, desiredcolumns: desiredcolumns, fullList: fullList});
          }
        })
      }
    });
  }
});

app.get('/admin/db/fix', auth, function(req, res){
  var desiredfields = [
    'id',
    'name',
    'email',
    'std',
    'invitation',
    'rsvp',
    'passcode',
    'additional_spots',
    'meal_choices',
    'used_spots'
  ];

  for(var i=0; i < desiredfields.length; i++) {
    var columnCheck = "SELECT EXISTS(SELECT * FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'test_database' AND TABLE_NAME = 'people' AND COLUMN_NAME = '" + desiredfields[i] + "');";

    connection.query(columnCheck, function(err, result){
      if (err) {
        console.log(err);
      }
      if (result) {
        var check = JSON.stringify({ data: result });
        var exists = JSON.parse(check).data[0][Object.keys(JSON.parse(check).data[0])];
        if (!exists){
          var query = Object.keys(JSON.parse(check).data[0])[0];
          var columnName = query.match(/COLUMN_NAME\ =\ \'(.+)\'\)/i)[1];
          var createColumn = "ALTER TABLE people ADD " + columnName + " varchar(256);";
          connection.query(createColumn, function(err, result){
            if (err) {
              console.log(err);
            }
            if (result) {
              console.log(result);
            }
          });
        }
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
// RSVP STUFF
/////////////////

app.post('/admin/db/generate-codes', auth, function(req, res){
  var getPeopleWhoNeedCodes = "SELECT * FROM people WHERE passcode IS NULL;";

  connection.query(getPeopleWhoNeedCodes, function(err, result) {
    if (err) {
      console.log(err);
    }
    if (result) {
      var rawResult = JSON.stringify({ data: result });
      var peopleWhoNeedCodes = JSON.parse(rawResult).data;
      for(var i = 0; i < peopleWhoNeedCodes.length; i++) {
        var tempPasscode = randomstring.generate(5).toLowerCase();
        var addPasscodeQuery = "UPDATE people SET passcode = '" + tempPasscode + "' WHERE id = " + peopleWhoNeedCodes[i].id + ";";
        connection.query(addPasscodeQuery, function(err, result) {
          if (err) {
            console.log(err);
          }
          if (result) {
            console.log(result);
          }
        });
      }
      res.send(JSON.stringify({ queries: peopleWhoNeedCodes.length}));
    }
  });

});

app.get('/rsvp', function(req, res){
  if(req.query.code) {
    var code = base32.decode(req.query.code);
    var email = code.split("|")[0];
    var passcode = code.split("|")[1].toLowerCase();
    var rsvpQuery = "SELECT * FROM people WHERE email = '" + email + "' AND passcode = '" + passcode + "';";

    connection.query(rsvpQuery, function(err, result){
      if (err) {
        res.render('rsvp-error');
      } 
      if (result) {
        if(result.length) {
          var dbResult = JSON.stringify({ data: result });
          var jsonData = JSON.parse(dbResult).data[0];
          var additional_guests = parseInt(jsonData.additional_spots);
          var rsvp = jsonData.rsvp;
          var usedSpots = jsonData.used_spots;
          var mealChoices = jsonData.meal_choices;
          res.render('rsvp', {additional_guests: additional_guests, rsvp: rsvp, usedSpots: usedSpots, mealChoices: mealChoices});
        } else {
          res.render('rsvp-error');
        }
      }
    });
  } else {
    res.redirect("/");
  }

});

app.post('/rsvp-submit', function(req, res){
  if(req.headers.host === 'www.yuanamarry.me' || req.headers.host === 'yuanamarry.me') {
    var rsvpData = req.body;
    var rsvp = rsvpData.rsvp;
    var used_spots;
    if(rsvpData.additional_guests) {
      used_spots = parseInt(rsvpData.additional_guests);
    } else {
      used_spots = 1;
    } 
    if(rsvp === "no") {
      used_spots = 0;
    }
    var meal_choices = rsvpData.meal_choices;
    var email = rsvpData.email;

    var rsvpDataQuery = "UPDATE people SET rsvp='" + rsvp + "', meal_choices='" + meal_choices + "', used_spots='" + used_spots + "' WHERE email='" + email + "';";

    connection.query(rsvpDataQuery, function(err, result) {
      if (err) {
        console.log(err);
        res.status(500).json({err: err});
      }

      if (result) {
        console.log(result);
        res.status(200).json({success: "success"});
      }
    });
  } else {
    res.status(400);
  }
});

app.post('/admin/db/set_additional_guests', auth, function(req,res){
  var updateObject = JSON.parse(JSON.stringify(req.body));
  for(var i=0; i<updateObject.length; i++){
    var rowObject = JSON.parse(updateObject[i]);
    var rowEmail = rowObject.email;
    var rowGuests = rowObject.additional_guests;

    if (parseInt(rowGuests) === -1){
      rowGuests = -1;
    } else if (rowGuests === "null" || parseInt(rowGuests) < 0 || !parseInt(rowGuests)) {
      rowGuests = 0;
    }
    var rowUpdateQuery = "UPDATE people SET additional_spots='" + parseInt(rowGuests).toString() + "' WHERE email='" + rowEmail +"';";
    connection.query(rowUpdateQuery, function(err,result){
      if(err){
        console.log(err);
      }
      if(result){
        console.log(result);
      }
    })
  }
  res.send(200);
});

///////////////////
// WEDDING DETAILS
//////////////////

app.get('/wedding', function(req, res) {
  res.render('wedding-details-lock');
});

/////////////////
// OUR STORY
/////////////////

app.get('/ourstory', function(req, res) {
  res.render('our-story-lock');
});

/////////////////
// HOME PAGE
/////////////////

// app.get('/', function(req, res){
//   res.render('index');
// });

app.get('/', function(req, res){
  res.render('index-lock');
});


module.exports = app;