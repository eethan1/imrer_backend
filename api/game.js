var express = require('express');
var router = express.Router();
var {Game, Player} = require('../model').models;
var ObjectId = require('mongoose').Types.ObjectId

router.post('/:gid/m_player', async function(req, res) {
    let user = req.user;
    let gid = req.params.gid, pid = req.body.pid, number = req.body.number;
    let player = {
        number: number,
        player: pid,
    }
    if(await req.user() && req.user.team.games.includes(gid)){
        if(pid !== 'anonymous' && await Player.findById(pid).exec()){
            let game = await Game.findById(gid).exec();
            game.m_players.push(player);
            game.save(function(err) {
                if(err) {
                    return res.status(400).send({status:'failed',msg:err.message});       
                }
                return res.send(game);
            });
        }else if(pid === 'anonymous'){
            let game = await Game.findById(gid).exec();
            game.m_players.push({
                number: number,
                pid: anonymouspid
            }); // TODO: make a anonymous player
            game.save(function(err) {
                if(err) {
                    return res.status(400).send({status:'failed',msg:err.message});       
                }
                return res.send(game);
            });
        }else{
            return res.status(400).send({status:'failed',msg:'game not found'});
        }
    }    
});


router.post('/:gid/g_player', async function(req, res) {
    let gid = req.params.gid, pid = req.body.pid, number = req.body.number;
    let player = {
        number: number,
        player: pid,
    }
    if(await req.user() && req.user.team.games.includes(gid)){
        if(pid !== 'anonymous' && await Player.findById(pid).exec()){
            let game = await Game.findById(gid).exec();
            console.log(game);
            game.g_players.push(player);
            game.save(function(err) {
                if(err) {
                    return res.status(400).send({status:'failed',msg:err.message});       
                }
                return res.send(game);
            });
        }else if(pid === 'anonymous'){
            let game = await Game.findById(gid).exec();
            game.g_players.push({
                number: number,
                pid: anonymouspid
            }); // TODO: make a anonymous player
            game.save(function(err) {
                if(err) {
                    return res.status(400).send({status:'failed',msg:err.message});       
                }
                return res.send(game);
            });
        }else{
            return res.status(400).send({status:'failed',msg:'game not found'});
        }
    }    
});


router.post('/:gid/record', async function(req, res) {
    let gid = req.params.gid;
    let record = {
        date: req.body.date,
        time: req.body.time,
        event: req.body.event,
        sub_type: req.body.sub_type,
        maker: req.body.maker && ObjectId(req.body.maker),
        relateds: req.body.relateds && req.body.relateds.map(x=>ObjectId(x)),
        x_loc: req.body.x_loc,
        y_loc: req.body.y_loc,
        comment: req.body.comment,
        value: req.body.value
    };
    if(await req.user() && req.user.team.games.includes(gid)){
        let game = await Game.findById(gid).exec();
        game.records.push(record);
        game.save(function(err) {
            if(err) {
                return res.status(400).send({status:'failed',msg:err.message});       
            }
            return res.send(game);
        });
        
    }else{
        return res.status(400).send({status:'failed',msg:'game not found'});
    }
});


router.post('/:gid/records', async function(req, res) {
    let gid = req.params.gid;
    if(!Array.isArray(req.body.records)) {
        return res.status(400).send({status:'failed'}).end();
    }
    if(await req.user() && req.user.team.games.includes(gid)){
        let game = await Game.findById(gid).exec();
        console.log(game);
        req.body.records.forEach(e=>{
            let record = {
                date: e.date,
                time: e.time,
                event: e.event,
                sub_type: e.sub_type,
                maker: e.maker && ObjectId(e.maker),
                relateds: e.relateds && e.relateds.map(x=>ObjectId(x)),
                x_loc: e.x_loc,
                y_loc: e.y_loc,
                comment: e.comment,
                value: e.value
            };
            game.records.push(record);
        });
        game.save(function(err) {
            if(err) {
                return res.status(400).send({status:'failed',msg:err.message}).end();
            }
            return res.send(game);
        });
    }    
});


// TODO: 水平權限
router.get(':gid', async function(req, res) {
    return res.send(await Game.findOne({_id:req.params.gid}).exec());
});


router.route('')
    .get(async function(req, res) {
        let games = await Game.find({},null).exec();
        return res.send(games).end();
    })

module.exports = router;