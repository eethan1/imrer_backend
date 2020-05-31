var express = require('express');
var router = express.Router();
var randomstring = require('randomstring');
var {User} = require('../model').models;


router.post('/register', function(req ,res){
    req.url = '/api/user';
    req.app.handle(req, res);
});


router.post('/login', function(req, res) {
    console.log('Login !');
    let cred = {
        account:req.body.account ,
        password: req.body.password 
    }
    User.findOne(cred, null, function(err, user) {
        if(err) {
            return res.status(500).send({status:'error', msg:err.message});
        }
        console.log(user)
        if(user === null) {
            return res.status(401).send({status: 'failed'});
        }
        user.session = randomstring.generate(32);
        user.save(function(err) {
            if(err) {
                return res.status(500).send({status:'failed',msg:err.message});
            }
            console.log(user);
            res.cookie('session', user.session);
            return res.send({status:'ack'});
        });
    });
});


router.use('', function(req,res,next){
    req.logined = function(){
        return Boolean(this.user);
    }
    req.user = async function (){
        console.log(req.cookies);
        if(req.cookies.session){
            this.user = await User.findOne({session:req.cookies.session},'-password -session').populate({path:'team'}).exec();
            return this.user;
        }
        return null;
    }
    next();
});


module.exports = {
    router:router
};