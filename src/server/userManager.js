var users = {};

const fs = require("fs");
const crypto = require("crypto");
const conf   = require("./config.js");
const path = conf.dataDir + "users.txt";
getUsers();

module.exports.addUser = function(name,pass){
    let answer = {};
    
    if(name in users){
	const hash = crypto.pbkdf2Sync(pass,users[name].salt,1000,64,"sha512").toString("hex");
	if(hash != users[name].pass){
	    answer.error = "User registered with different password\n";
	}
    }else{
	const s = crypto.randomBytes(16).toString("hex");
	const hash = crypto.pbkdf2Sync(pass,s,1000,64,"sha512").toString("hex");
	users[name] = {
	    pass : hash,
	    salt : s
	};
	saveUsers();
    }

    return answer;
}

module.exports.authorized = function(name,pass){
    if(name in users){
	const hash = crypto.pbkdf2Sync(pass,users[name].salt,1000,64,"sha512").toString("hex");
	return hash === users[name].pass;
    }

    return false;
}

function getUsers(){
    fs.readFile(path,function(err,data){
	if(!err){
	    users = JSON.parse(data.toString());
	}else{ console.log(err); }
    });
}

function saveUsers(){
    fs.writeFile(path,JSON.stringify(users),function(err){
	if(err)
	    console.log(err);
    });
}
