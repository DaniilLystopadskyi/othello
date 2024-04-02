var groups = {};

const fs     = require("fs");
const crypto = require("crypto");
const conf   = require("./config.js");
const path = conf.dataDir + "groups.txt";
loadGroups();

module.exports.assignGroup = function(group,nick){
    let answer = {};
    
    if(group in groups){
	let groupObj = groups[group];
	if(groupObj.players.length == 1){
	    groupObj.players.push(nick);
	    answer.game = groupObj.game;
	    answer.color = "light";
	}else
	    answer.error = "Invalid group\n";
    }else{
	const gameId = generateId(group);	
	groups[group] = {
	    players : [nick],
	    game : gameId
	};
	answer.game = gameId;
	answer.color = "dark";
    }

    saveGroups();

    return answer;
}

module.exports.removeGroup = function(group){
    if(group in groups){
	delete groups[group];
	saveGroups();
    }
}

function generateId(group){
    const date = new Date();
    const value = date.getTime().toString() + group;

    const hash = crypto
          .createHash('md5')
          .update(value)
          .digest('hex');

    return hash;
}

function saveGroups(){
    fs.writeFile(path,JSON.stringify(groups),function(err){
	if(err)
	    console.log(err);
    });
}

function loadGroups(){
    fs.readFile(path,function(err,data){
	if(!err){
	    groups = JSON.parse(data.toString());
	}else{ console.log(err); }
    });
}
