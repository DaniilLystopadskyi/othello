var ranking = {};

const fs = require("fs");
const conf = require("./config.js");
const path = conf.dataDir + "ranking.txt";
formTable();

module.exports.getTable = function(){
    let sorted = ranking.ranking.sort((a,b) => (a.victories < b.victories) ? 1 : -1);
    if(sorted.length >= 10)
	sorted = sorted.slice(0,10);
    return {"ranking" : sorted};
}

module.exports.incGames = function(nick,winner){
    let table = ranking.ranking;
    let exists = false;
    
    for(user of table){
	if(user.nick === nick){
	    exists = true;
	    user.games++;
	    if(winner)
		user.victories++;
	}
    }

    if(!exists){
	const wins = (winner == true) ? 1 : 0;
	table.push({
	    "nick" : nick,
	    "victories" : wins,
	    "games" : 1
	});
    }

    saveTable();
}

function formTable(){
    fs.readFile(path,function(err,data){
	if(!err){
	    ranking = JSON.parse(data.toString());
	}else{ console.log(err); }
    });
}

function saveTable(){
    fs.writeFile(path,JSON.stringify(ranking),function(err){
	if(err)
	    console.log(err);
    });
}
