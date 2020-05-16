var mongoose = require('mongoose');
var randomstring = require('randomstring');
mongoose.connect('mongodb://localhost/ntuim', {useNewUrlParser: true});
var db = mongoose.connection;
var Schema = mongoose.Schema;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  // we're connected!
  console.log('connect');
});

var RecordSchema = new Schema({
    date:{type:Date, default:Date.now},
    time:{type:Number, required:true, min:0}, // second. 在?比賽時間
    quarter:{type:Number, default:1}, // nth quarter
    event: {type:String, default:'score'},
    sub_type: {type:String, default:null},
    maker: {type: Schema.Types.ObjectId, ref: 'Player', required:true},
    relateds: [
        {type: Schema.Types.ObjectId, ref: 'Player', required:true}
    ],
    comment:{type:String, default:''},
    value:{type:Number, default:50} // convert 等級 to number e.g. A->90
});

RecordSchema.method('withAll', async function(){
    await this.populate('maker.player').populate('relateds.player');
    return this;
});

var GameSchema = new Schema({
    date:{type:Date, default:Date.now},
    championship:{type:String, default:null},
    name:{type:String, default: function() {
            return `${this.master} v.s. ${this.guest}`;    
        }
    },
    guest: {type: String, required:true},
    master: {type: String, required:true},
    g_players:[
        {
            number: {type:Number, default:-1},
            player: {type: Schema.Types.ObjectId, ref: 'Player', required:false}
        }
    ],
    m_players:[
        new Schema({
            number: {type:Number, default:-1},
            player: {type: Schema.Types.ObjectId, ref: 'Player', required:false}
        })
    ],
    g_point: {type: Number, default:0},
    m_point: {type: Number, default:0},
    confirm: {type:Boolean, default:false},
    records:[RecordSchema]
});

GameSchema.method('getPlayers', async function() {
    await this.populate('g_players').populate('m_players').execPopulate();
    return {m_players: this.m_players, g_players: this.g_players};
});

GameSchema.method('getRecords', async function(){
    await this.populate('records').execPopulate();
    return this.records;
});

GameSchema.method('withAll', async function(){
    await this.getPlayers();
    await this.getRecords();
    return this
});

GameSchema.method('findById', async function(_id){
    return this.find(e => e._id === _id);
});

var PlayerSchema = new Schema({
    name: {type: String, required: true},
    grade: {type: String, required: true},
    birth: {type: Date, default: Date.now},
    number: {type: Number, required: true},
    position: {type: String, required: true}
});

var TeamSchema =  new Schema({
    name:   String,
    win:    {type:Number, default:0},
    lose:   {type:Number, default:0},
    tie:   {type:Number, default:0},
    sport_type: String,
    description: String,
    players: [{type: Schema.Types.ObjectId, ref: 'Player'}],
    games: [{type: Schema.Types.ObjectId, ref: 'Game'}], 
    e_score: {type:Number, default:50}, // Evalution score
    createdDate: {type:Date, default: Date.now},
});

TeamSchema.method('getGames', async function() {
    await this.populate('games').execPopulate();
    return this.games;
});

TeamSchema.method('getPlayers', async function() {
    await this.populate('players').execPopulate();
    return this.players;
});

TeamSchema.method('withAll', async function() {
    await this.getGames();
    await this.getPlayers();
    return this;
});


var UserSchema = new Schema({
    account:{type:String,unqiue:true, required:true},
    password:{type:String,required:true},
    team: {type: Schema.Types.ObjectId, ref: 'Team'},
    session:{type: String, maxlength:32, minlength:32, default:(()=>{return randomstring.generate(32)})}
});

UserSchema.method('getGames', async function() {
    await this.team.getGames();
    return this.team.games;
});


module.exports = {
    schemas:{
        UserSchema:UserSchema,
        TeamSchema:TeamSchema,
        PlayerSchema:PlayerSchema,
        GameSchema:GameSchema,
        RecordSchema:RecordSchema
    },
    db:db
}