var express = require('express');
var router = express.Router();
var {User, Team} = require('model').models;

router.route('/user')
    .get(global.middlewares.requiredLoggined,async function(req, res) {
        console.log('user');
            return req.user;
        })
    .post(async function(req, res) {
        let acc = req.body.account, pass = req.body.password;
        if(acc !== undefined && pass !== undefined){
            let user = new User({account:acc,password:pass});
            user.save((err) => {
                if(err) {
                    console.err(err);
                }
                res.send(user).end();
            });
        }else{
            res.status(400);
            res.send({status:'failed', msg:'account or password undefined'});
            console.log(req.body);
        }
    });



router.use('/user',global.middlewares.requiredLoggined);
router.get('/user/self', async function(req, res) {
    return res.send(req.user);
});


router.get('/user/self/team', async function(req, res) {
    req.url = '/api/team/self';
    req.app.handle(req, res);
});

router.get('/user/self/team/games', async function(req, res) {
    req.url = '/api/team/self/games';
    req.app.handle(req, res);
});

router.post('/user/self/team', async function(req, res) {
    let team = new Team(req.body);
    team.save(function(err) {
        if(err) {
            return res.status(400).send({status:'failed',msg:err.message}).end();    
        }
        req.user.team = team._id;
        req.user.save(function(err) {
            if(err) {
                return res.status(400).send({status:'failed',msg:err.message}).end();    
            }
            req.user.team = team;
            return res.send(req.user);
        });
    })
    
}); 


module.exports = router

