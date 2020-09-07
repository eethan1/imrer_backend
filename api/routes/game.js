var express = require('express');
var router = express.Router();
var {Game, Player, Record} = require('model').models;
var ObjectId = require('mongoose').Types.ObjectId;

// TODO: 水平權限
router.get('/game/:gid([a-z0-9]{24})', async function(req, res) {
    return res.send(await Game.findOne({_id:req.params.gid}).populate('records').exec());
});


router.route('/games')
    .get(async function(req, res) {
        let games = await Game.find({},null).exec();
        return res.send(games).end();
    });


router.use('/game',global.middlewares.requiredLoggined);
router.delete('/game/:gid', async function(req, res){
    Game.deleteOne({_id: req.params.gid}, function(err, result){
        if (err) {
            res.send(err);
        }
        else {
            res.send(result);
        }
    })
    
})

router.post('/game/:gid/m_player', async function(req, res) {
    let user = req.user;
    let gid = req.params.gid, pid = req.body.pid, number = req.body.number;
    let player = {
        number: number,
        player: pid,
    }
    if(req.user.team.games.includes(gid)){
        let game = await Game.findById(gid).exec();
        console.log(game);
        game.m_players.push(player);
        game.save(function(err) {
            if(err) {
                return res.status(400).send({status:'failed',msg:err.message});       
            }
            return res.send(game);
        });
    }else{
        return res.status(400).send({status:'failed',msg:'game not owned'});
    }    
});


router.post('/game/:gid/g_player', async function(req, res) {
    let gid = req.params.gid, pid = req.body.pid, number = req.body.number;
    let player = {
        number: number,
        player: pid,
    };
    if(req.user.team.games.includes(gid)){
        let game = await Game.findById(gid).exec();
        console.log(game);
        game.g_players.push(player);
        game.save(function(err) {
            if(err) {
                return res.status(400).send({status:'failed',msg:err.message});       
            }
            return res.send(game);
        });
    }else{
        return res.status(400).send({status:'failed',msg:'game not owned'});
    }
});


router.put('/game/:gid/g_point', async function(req, res) {
    let gid = req.params.gid, new_point = req.body.point;
    Game.update({_id: gid}, {g_point: new_point}, function(err, result){
        if(err){
            res.status(400).send({status:'failed',msg:err.message})
        }
        else{
            res.send(result);
        }
    })
});

router.put('/game/:gid/m_point', async function(req, res) {
    let gid = req.params.gid, new_point = req.body.point;
    Game.update({_id: gid}, {m_point: new_point}, function(err, result){
        if(err){
            res.status(400).send({status:'failed',msg:err.message})
        }
        else{
            res.send(result);
        }
    })
});

router.post('/game/:gid/record', async function(req, res) {
    let gid = req.params.gid;
    if(req.user.team.games.includes(gid)){
        let game = await Game.findById(gid).exec();
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
        return res.status(400).send({status:'failed',msg:'game not owned'});
    }
});


router.post('/game/:gid/records', async function(req, res) {
    let gid = req.params.gid;
    if(!Array.isArray(req.body)) {
        return res.status(400).send({status:'failed',msg:'not a array'}).end();
    }

    if(req.user.team.games.includes(gid)){
        let game = await Game.findById(gid).exec();
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
        return res.status(400).send({status:'failed',msg:'game not owned'});
    }
});


module.exports = router;
