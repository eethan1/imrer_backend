var express = require('express');
var router = express.Router();
var {apis} = require('./config');
var auth = require('./auth');

router.use('/api',auth.router);

apis.forEach(api => {
    router.use(`/api`, require(`./${api.name}`));
});

module.exports = router;