var mongoose = require('mongoose');
var {schemas, db} = require('./schema');


var models={};
for(let c of Object.keys(schemas)) {
    models[c.replace('Schema','')] = db.model(c.replace('Schema',''),schemas[c]);
}


module.exports = {
    models:models,
    db:db,
    ObjectId:mongoose.Types.ObjectId
}