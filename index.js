var {models} = require('./model');
var express = require('express');
var bodyparser = require('body-parser');
var app = express();
var {User,Team,Player,Game,Record} = models;



app.use(bodyparser());
app.use(require('cookie-parser')());
app.use(function(req, res, next) {
    console.log(req.url);
    console.log(req.params);
    console.log(req.body);
    next();
});

app.use(require('./api'));

app.all('/', function(req, res) {
    res.status(404).send('JIzz found');
});

app.listen(8787,'127.0.0.1',function(){
    console.log(`listen on 127.0.0.1:8787`);
});
