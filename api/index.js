var express = require('express');
var router = express.Router();
var {apis} = require('./config');
var auth = require('./routes/auth');

router.use('/api',auth.router);

apis.forEach(api => {
    router.use(`/api`, require(`./routes/${api.name}`));
});

module.exports = router;