var express = require('express');
var router = express.Router();
var {User, Team} = require('model').models;
router.route('/user')
    .get(async function(req, res) {
        console.log('user');
            await User.findOne({},'-password -session').populate('team').exec(function(err, user) {
                console.log(user);
                res.send(user);
            });
            return;
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

router.get('/user/self', async function(req, res) {
    
    if(await req.user())
        return res.send(req.user);
    else
        return res.status(403).send({status:'failed'}).end();
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
    let team = {
        name:req.body.name,
        sport_type:req.body.sport_type,
        description:req.body.description || ''
    }
    if(await req.user()) {
        team_ = new Team(team);
        team_.save(function(err) {
            if(err) {
                return res.status(400).send({status:'failed',msg:err.message}).end();    
            }
            req.user.team = team_._id;
            req.user.save(function(err) {
                if(err) {
                    return res.status(400).send({status:'failed',msg:err.message}).end();    
                }
                req.user.team = team_
                return res.send(req.user);
            });
        })
    }else{
        return res.status(403).send({status:'failed'}).end();
    }
}); 


module.exports = router

