var express = require('express');
var router = express.Router();
var {Record} = require('../model').models;


router.get('/records/maker/:pid', async function(req, res) {
    let records = await Record.find({maker: req.params.pid}).exec();
    return res.send(records);
});


module.exports = router;