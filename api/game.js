var express = require('express');
var router = express.Router();
var {Game, Player, Record} = require('model').models;
var ObjectId = require('mongoose').Types.ObjectId;

router.post('/game/:gid/m_player', async function(req, res) {
    let user = req.user;
    let gid = req.params.gid, pid = req.body.pid, number = req.body.number;
    let player = {
        number: number,
        player: pid,
    }
    if(await req.user() && req.user.team.games.includes(gid)){
        let game = await Game.findById(gid).exec();
        console.log(game);
        game.m_players.push(player);
        game.save(function(err) {
            if(err) {
                return res.status(400).send({status:'failed',msg:err.message});       
            }
            return res.send(game);
        });
    }    
});


router.post('/game/:gid/g_player', async function(req, res) {
    let gid = req.params.gid, pid = req.body.pid, number = req.body.number;
    let player = {
        number: number,
        player: pid,
    };
    if(await req.user() && req.user.team.games.includes(gid)){
        let game = await Game.findById(gid).exec();
        console.log(game);
        game.g_players.push(player);
        game.save(function(err) {
            if(err) {
                return res.status(400).send({status:'failed',msg:err.message});       
            }
            return res.send(game);
        });
    }    
});


router.post('/game/:gid/record', async function(req, res) {
    let gid = req.params.gid;
    if(await req.user() && req.user.team.games.includes(gid)){
        let game = await Game.findById(gid).exec();
        if(game) {
            let record = await Record.create(req.body);
            game.records.push(record._id);
            game.save(async function(err) {
                if(err) {
                    return res.status(400).send({status:'failed',msg:err.message}).end();
                }
                await game.getRecords();
                return res.send(game);
            });
        }else{
            return res.status(400).send({status:'failed',msg:'game not found'});    
        }
    }else{
        return res.status(400).send({status:'failed',msg:'user not authed'});
    }
});


router.post('/game/:gid/records', async function(req, res) {
    let gid = req.params.gid;
    if(!Array.isArray(req.body)) {
        return res.status(400).send({status:'failed',msg:'not a array'}).end();
    }

    if(await req.user() && req.user.team.games.includes(gid)){
        let game = await Game.findById(gid).exec();
        if(game) {
            let records = await Record.insertMany(req.body);
            records.forEach(e=>{
                game.records.push(e._id);
            });
            game.save(async function(err) {
                if(err) {
                    return res.status(400).send({status:'failed',msg:err.message}).end();
                }
                await game.getRecords();
                return res.send(game);
            });
        }else{
            return res.status(400).send({status:'failed',msg:'game not found'});    
        }
    }else{
        return res.status(400).send({status:'failed',msg:'user not authed'});
    }
});


// TODO: 水平權限
router.get('/game/:gid', async function(req, res) {
    return res.send(await Game.findOne({_id:req.params.gid}).exec());
});


router.route('/games')
    .get(async function(req, res) {
        let games = await Game.find({},null).exec();
        return res.send(games).end();
    });

module.exports = router;