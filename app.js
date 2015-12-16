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

// connection.connect(function(err) {
//   if (err) throw err
//   console.log('You are now connected...')

//   connection.query('CREATE TABLE people(id int primary key, name varchar(255), age int, address text)', function(err, result) {
//     if (err) throw err
//     connection.query('INSERT INTO people (name, age, address) VALUES (?, ?, ?)', ['Larry', '41', 'California, USA'], function(err, result) {
//       if (err) throw err
//       connection.query('SELECT * FROM people', function(err, results) {
//         if (err) throw err
//         console.log(results[0].id)
//         console.log(results[0].name)
//         console.log(results[0].age)
//         console.log(results[0].address)
//       })
//     })
//   }) 
// })

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res){
  connection.query('SELECT * FROM people', function(err, rows){
    res.render('users', {name : rows});
  });
});

module.exports = app;