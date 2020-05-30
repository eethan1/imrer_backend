var {models} = require('./model');
var express = require('express');
var bodyparser = require('body-parser');
var app = express();
var {HOST, PORT} = require('./config');
var cors = require('cors');

const corsOptions = {
    origin:`*`
    ,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));


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

app.listen(PORT,HOST,function(){
    console.log(`listen on ${HOST}:${PORT}`);
});
