var express = require('express');
var router = express.Router();
var {Team,Game,Player, User} = require('model').models;
var ObjectId = require('mongoose').Types.ObjectId



router.route('/team/:teamid([a-z0-9]{24})')
    .get(async function(req, res) {
        let team = await Team.findById(req.params.teamid, null).exec();
        return res.send(team).end();
    });

router.route('/teams')
    .get(async function(req, res) {
        let team = await Team.find({}, null).populate('games').populate('players').exec();
        console.log(team);
        res.send(team).end();
    });



router.use('/team',global.middlewares.requiredLoggined);
router.post('/team/self/player', async function(req, res) {
    let team = req.user.team;
    req.body.creater = req.user._id;
    let player = new Player(req.body);
    player.save(function(err) {
        if(err) {
            return res.status(400).send({status:'failed',msg:err.message}).end();
        }
        console.log(this);
        team.players.push(player._id);
        team.save(async function(err) {
            if(err) {
                return res.status(400).send({status:'failed',msg:err.message}).end();
            }
            await team.populate('players').execPopulate();
            return res.send(team);
        });
    });
});

router.post('/team/self/game',async function(req, res) {
        if(req.user.team) {
            let team = req.user.team;
            let game = new Game(req.body);
            console.log('converted',team);
            game.save(function(err) {
                if(err) {
                    return res.status(400).send({status:'failed',msg:err.message}).end();
                }
                team.games.push(game._id);
                team.save(async function(err) {
                    if(err) {
                        return res.status(400).send({status:'failed',msg:err.message}).end();
                    }
                    await team.getGames();
                    return res.send(team);
                });
            });
        }else{
            return res.status(400).send({status:'team not exist'});   
        }
    })

router.get('/team/self', async function(req, res) {
    console.log('jizz');
    if(req.user.team)
        await req.user.team.withAll();
    return res.send(req.user.team);
});




module.exports = router;