var express = require('express');
var router = express.Router();
var {Player} = require('model').models;

router.get('/player/:pid/records', async function(req, res){
    let pid = req.params.pid;
    let cond = req.query.cond;
    let player = await Player.findById(pid).exec();
    let records = await player.getRecords(cond);
    let data = {
        count: records.length,
        records: records
    }
    console.log("data: ", data);
    return res.send(data)
})

module.exports = router;