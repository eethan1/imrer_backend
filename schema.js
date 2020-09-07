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
    time:{type:Number, required:true, min:0}, // 在比賽中的第幾秒，單位 sec
    score_team:{type:String, default:'none'}, // 得分方 (ally, enemy, none)
    event: {type:String, default:'score'}, // 事件 (ATK, BLOCK, SET, SERVE, RCV, NONE)
    maker: {type:Schema.Types.ObjectId, ref: 'Player', required:true}, // 造成犯規/得分/助攻之類的人
    quality:{type:Number, default:50}, // 使用者對這個 play 的評分，會從 A,B,C 轉成數值儲存
    x_loc:{type:Number, default:-1}, // 發生的座標， -1 代表場外(技術犯規、換人之類的)
    y_loc:{type:Number, default:-1},
});

RecordSchema.method('withAll', async function(){
    await this.populate('maker.player').populate('relateds.player');
    return this;
});

var GameSchema = new Schema({
    date:{type:Date, default:Date.now}, // 比賽日期
    championship:{type:String, default:null}, // 所屬聯賽、錦標賽名
    name:{type:String, default: function() { 
            return `${this.master} v.s ${this.guest}`;    
        }
    }, // 比賽名 e.g. 台大資管v.s.台大資工
    guest: {type: String, required:true}, // 客場隊伍名
    master: {type: String, required:true}, // 主場隊伍名
    g_players:[
        {
            number: {type:Number, default:-1}, // 背號
            player: {type: Schema.Types.ObjectId, ref: 'Player', required:false} // 球員
        }
    ], // 客場的球員們
    m_players:[
        {
            number: {type:Number, default:-1}, // 背號
            player: {type: Schema.Types.ObjectId, ref: 'Player', required:false} // 球員
        }
    ], // 主場的球員們
    g_point: {type: Number, default:0}, // 客隊得分
    m_point: {type: Number, default:0}, // 主隊得分
    confirm: {type:Boolean, default:false}, // 紀錄是否確認
    records:[
        {type: Schema.Types.ObjectId, ref: 'Record', required:false}
    ], // 擁有的紀錄們
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
    await this.populate('g_players').populate('m_players').populate('records').execPopulate();
    return this;
});

GameSchema.method('findById', async function(_id){
    return this.find(e => e._id === _id);
});

var PlayerSchema = new Schema({
    creater: {type: Schema.Types.ObjectId, ref: 'User'},
    name: {type: String, required: true}, // 背號
    grade: {type: String, required: true}, // 年級
    birth: {type: Date, default: Date.now}, // 生日
    number: {type: Number, required: true}, // 背號
    position: {type: String, required: true} // 打的位置
});

var TeamSchema =  new Schema({
    name:   String, // 隊名
    win:    {type:Number, default:0}, // 勝場
    lose:   {type:Number, default:0}, // 敗場
    tie:   {type:Number, default:0}, // 平手場
    sport_type: String, // 運動類型
    description: {type:String, default:''}, // 隊伍自介
    players: [{type: Schema.Types.ObjectId, ref: 'Player'}], // 擁有的球員們
    games: [{type: Schema.Types.ObjectId, ref: 'Game'}], // 擁有的比賽們
    e_score: {type:Number, default:50}, // 隊伍綜合戰力之類的東東
    createdDate: {type:Date, default: Date.now}, // 使用者創立隊伍的日期
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
    account:{type:String,unqiue:true, required:true}, // 帳號
    password:{type:String,required:true}, // 密碼
    team: {type: Schema.Types.ObjectId, ref: 'Team'}, // 擁有的隊伍
    session:{type: String, maxlength:32, minlength:32, default:(()=>{return randomstring.generate(32)})} // 登入後使用的憑證
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