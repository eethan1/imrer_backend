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
    maker: {type:Schema.Types.ObjectId, ref: 'Player', required:false}, // 造成犯規/得分/助攻之類的人
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
    mainStats: [
        {
            title: {type: String, required: true},
            value: {type: Number, required: true}
        }
    ],
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

GameSchema.method('getMainStats', async function(){
    await this.getRecords();
    if(this.mainStats.length){
        this.mainStats = [];
    }
    var atkScores = this.records.filter(record => record.event == "ATK" && record.score_team == "ally").length;
    var blockScores = this.records.filter(record => record.event == "BLOCK" && record.score_team == "ally").length;
    var ace = this.records.filter(record => record.event == "SERVE" && record.score_team == "ally").length;
    var enemyError = this.records.filter(record => record.maker == "548754875487548754875487" && record.score_team == "ally").length;
    var receiveError = this.records.filter(record => record.event == "RCV" && record.score_team == "enemy").length;
 
    this.mainStats.push({
        title: "攻擊得分",
        value: atkScores
    });
    this.mainStats.push({
        title: "攔網得分",
        value: blockScores
    });
    this.mainStats.push({
        title: "Ace",
        value: ace
    });
    this.mainStats.push({
        title: "敵方失誤",
        value: enemyError
    });
    this.mainStats.push({
        title: "一傳失誤",
        value: receiveError
    });
})

GameSchema.method('getRecordsOf', async function(cond){
    await this.getRecords();

    var records = this.records.filter(record => record.maker != "548754875487548754875487");

    switch(cond){
        case 'atk':
            return records.filter(record => record.event == 'ATK');

        case 'perfect_atk':
            return records.filter(record => record.event == 'ATK' && record.quality == 100);

        case 'perfect_atk_score':
            return records.filter(record => record.event == 'ATK' && record.quality == 100 && record.score_team == 'ally');

        case 'perfect_atk_none':
            return records.filter(record => record.event == 'ATK' && record.quality == 100 && record.score_team == 'none');
        
        case 'perfect_atk_lose':
            return records.filter(record => record.event == 'ATK' && record.quality == 100 && record.score_team == 'enemy');
    
        case 'perfect_atk_normal_set':
            return records.filter((record, i, r) => record.event == 'ATK' && record.quality == 100 && r[max(0, i-1)].event == 'SET' && r[max(0, i-1)].quality == 50);

        case 'perfect_atk_bad_set':
            return records.filter((record, i, r) => record.event == 'ATK' && record.quality == 100 && r[max(0, i-1)].event == 'SET' && r[max(0, i-1)].quality == 0);

        case 'normal_atk':
            return records.filter(record => record.event == 'ATK' && record.quality == 50);

        case 'normal_atk_score':
            return records.filter(record => record.event == 'ATK' && record.quality == 50 && record.score_team == 'ally');

        case 'normal_atk_none':
            return records.filter(record => record.event == 'ATK' && record.quality == 50 && record.score_team == 'none');
        
        case 'normal_atk_lose':
            return records.filter(record => record.event == 'ATK' && record.quality == 50 && record.score_team == 'enemy');

        case 'normal_atk_normal_set':
            return records.filter((record, i, r) => record.event == 'ATK' && record.quality == 50 && r[max(0, i-1)].event == 'SET' && r[max(0, i-1)].quality == 50);

        case 'normal_atk_bad_set':
            return records.filter((record, i, r) => record.event == 'ATK' && record.quality == 50 && r[max(0, i-1)].event == 'SET' && r[max(0, i-1)].quality == 0);

        case 'bad_atk':
            return records.filter(record => record.event == 'ATK' && record.quality == 0);

        case 'bad_atk_score':
            return records.filter(record => record.event == 'ATK' && record.quality == 0 && record.score_team == 'ally');

        case 'bad_atk_none':
            return records.filter(record => record.event == 'ATK' && record.quality == 0 && record.score_team == 'none');
        
        case 'bad_atk_lose':
            return records.filter(record => record.event == 'ATK' && record.quality == 0 && record.score_team == 'enemy');
        
        case 'bad_atk_normal_set':
            return records.filter((record, i, r) => record.event == 'ATK' && record.quality == 0 && r[max(0, i-1)].event == 'SET' && r[max(0, i-1)].quality == 50);

        case 'bad_atk_bad_set':
            return records.filter((record, i, r) => record.event == 'ATK' && record.quality == 0 && r[max(0, i-1)].event == 'SET' && r[max(0, i-1)].quality == 0);
        
        case 'special_atk':
            return records.filter(record => record.event == 'ATK' && record.quality == 25);

        case 'special_atk_score':
            return records.filter(record => record.event == 'ATK' && record.quality == 25 && record.score_team == 'ally');

        case 'special_atk_none':
            return records.filter(record => record.event == 'ATK' && record.quality == 25 && record.score_team == 'none');
        
        case 'special_atk_lose':
            return records.filter(record => record.event == 'ATK' && record.quality == 25 && record.score_team == 'enemy');
        
        case 'special_atk_normal_set':
            return records.filter((record, i, r) => record.event == 'ATK' && record.quality == 25 && r[max(0, i-1)].event == 'SET' && r[max(0, i-1)].quality == 50);

        case 'special_atk_bad_set':
            return records.filter((record, i, r) => record.event == 'ATK' && record.quality == 25 && r[max(0, i-1)].event == 'SET' && r[max(0, i-1)].quality == 0);
            
        case 'block':
            console.log('records are:', records.filter(record => record.event == 'BLOCK'));
            return records.filter(record => record.event == 'BLOCK');
        
        case 'perfect_block':
            console.log('records are:', records.filter(record => record.event == 'BLOCK' && record.quality == 100))
            return records.filter(record => record.event == 'BLOCK' && record.quality == 100);

        case 'perfect_block_score':
            return records.filter(record => record.event == 'BLOCK' && record.quality == 100 && record.score_team == 'ally');

        case 'perfect_block_lose':
            return records.filter(record => record.event == 'BLOCK' && record.quality == 100 && record.score_team == 'enemy');

        case 'normal_block':
            return records.filter(record => record.event == 'BLOCK' && record.quality == 50);

        case 'normal_block_perfect_atk':
            return this.records.filter((record, i) => record.event == 'BLOCK' && record.quality == 50 && this.records[max(0, i-1)].maker == "548754875487548754875487" && this.records[max(0, i-1)].event == "ATK" && this.records[max(0, i-1)].quality == 100);

        case 'normal_block_special_atk':
            return this.records.filter((record, i) => record.event == 'BLOCK' && record.quality == 50 && this.records[max(0, i-1)].maker == "548754875487548754875487" && this.records[max(0, i-1)].event == "ATK" && this.records[max(0, i-1)].quality == 25);

        case 'bad_block':
            return records.filter(record => record.event == 'BLOCK' && record.quality == 0);
    
        case 'serve':
            return records.filter(record => record.event == 'SERVE');

        case 'perfect_serve':
            return records.filter(record => record.event == 'SERVE' && record.quality == 100);

        case 'perfect_serve_score':
            return records.filter(record => record.event == 'SERVE' && record.quality == 100 && record.score_team == 'ally');

        case 'perfect_serve_enemy_error':
            return this.records.filter((record, i) => record.event == 'SERVE' && record.quality == 100 && this.records[min(this.records.length-1, i+1)].score_team == 'ally');

        case 'normal_serve':
            return records.filter(record => record.event == 'SERVE' && record.quality == 50);

        case 'normal_serve_score':
            return records.filter(record => record.event == 'SERVE' && record.quality == 50 && record.score_team == 'ally');

        case 'normal_serve_enemy_error':
            return this.records.filter((record, i) => record.event == 'SERVE' && record.quality == 50 && this.records[min(this.records.length-1, i+1)].score_team == 'ally');

        case 'bad_serve':
            return records.filter(record => record.event == 'SERVE' && record.quality == 0);

        case 'bad_serve_net': // Not finished
            return records.filter(record => record.event == 'SERVE' && record.quality == 0);

        case 'bad_serve_outside': // Not finished
            return records.filter(record => record.event == 'SERVE' && record.quality == 0);

        case 'receive':
            return records.filter(record => record.event == 'RCV');

        case 'perfect_receive':
            return records.filter(record => record.event == "RCV" && record.quality == 100);

        case 'perfect_receive_normal_set':
            return records.filter((record, i) => record.event == "RCV" && record.quality == 100 && records[min(this.records.length-1, i+1)].event == "SET" && records[min(this.records.length-1, i+1)].quality == 50);
        
        case 'perfect_receive_bad_set':
            return records.filter((record, i) => record.event == "RCV" && record.quality == 100 && records[min(this.records.length-1, i+1)].event == "SET" && records[min(this.records.length-1, i+1)].quality == 0);
        
        case 'normal_receive':
            return records.filter(record => record.event == "RCV" && record.quality == 50);

        case 'normal_receive_normal_set':
            return records.filter((record, i) => record.event == "RCV" && record.quality == 50 && records[min(this.records.length-1, i+1)].event == "SET" && records[min(this.records.length-1, i+1)].quality == 50);
        
        case 'normal_receive_bad_set':
            return records.filter((record, i) => record.event == "RCV" && record.quality == 50 && records[min(this.records.length-1, i+1)].event == "SET" && records[min(this.records.length-1, i+1)].quality == 0);

        case 'bad_receive':
            return records.filter(record => record.event == "RCV" && record.quality == 100);

        case 'bad_receive_cover':
            return records.filter((record, i) => record.event == "RCV" && record.quality == 100 && records[min(this.records.length-1, i+1)].event == "SET" && records[min(this.records.length-1, i+1)].quality == 50);
        
        case 'bad_receive_lose':
            return records.filter((record, i) => record.event == "RCV" && record.quality == 100 && record.score_team == 'enemy');

        default:
            return records;
    }
})

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

function max(a, b){
    return a > b ? a : b;
}

function min(a, b){
    return a < b ? a : b;
}