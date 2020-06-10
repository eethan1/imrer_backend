var express = require('express');
var router = express.Router();
var {Team,Game,Player, User} = require('../model').models;
var ObjectId = require('mongoose').Types.ObjectId

router.post('/team/self/player', async function(req, res) {
    if( await req.user() && req.user.team) {
        let team = req.user.team;
        let player = new Player({
            name:req.body.name,
            grade:req.body.grade,
            birth:req.body.birth,
            number:req.body.number,
            position: req.body.position
        });
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
        
    }else    
        return res.status(400).send({status:'failed'});   
});

router.post('/team/self/game',async function(req, res) {
        if(await req.user() && req.user.team) {
            let team = req.user.team;
            let game = new Game({
                date:   req.body.date,
                championship:   req.body.championship,
                name:   req.body.name,
                guest:  req.body.guest,
                master: req.body.master,
                m_players: req.body.m_players && req.body.m_players.map(x=>ObjectId(x)),
                g_players: req.body.g_players && req.body.g_players.map(x=>ObjectId(x)),
                g_point:req.body.g_point,
                m_point:req.body.m_point,
            });
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
            return res.status(400).send({status:'failed'});   
        }
    })

router.get('/team/self', async function(req, res) {
    console.log('jizz');
    if(await req.user()){
        if(req.user.team)
            await req.user.team.withAll();
        return res.send(req.user.team);
    }else
        return res.status(403).send({status:'failed'});
});


router.route('/team/:teamid')
    .get(async function(req, res) {
        let team = Team.findById(req.params.teamid, null).exec();
        console.log(team);
        res.send(team).end();
    });


router.route('/teams')
    .get(async function(req, res) {
        let team = await Team.find({}, null).populate('games').populate('players').exec();
        console.log(team);
        res.send(team).end();
    });

module.exports = router;