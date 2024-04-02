var games = {};

const fs = require("fs");
const conf = require("./config.js");
const path = conf.dataDir + "games.txt";
getGames();

module.exports.startGame = function(game,group){
    games[game] = {
	board : [
	    ["empty","empty","empty","empty","empty","empty","empty","empty"],
	    ["empty","empty","empty","empty","empty","empty","empty","empty"],
	    ["empty","empty","empty","empty","empty","empty","empty","empty"],
	    ["empty","empty","empty","light","dark" ,"empty","empty","empty"],
	    ["empty","empty","empty","dark", "light","empty","empty","empty"],
	    ["empty","empty","empty","empty","empty","empty","empty","empty"],
	    ["empty","empty","empty","empty","empty","empty","empty","empty"],
	    ["empty","empty","empty","empty","empty","empty","empty","empty"]     
	],
	players : {},
	turn : "dark",
	counter : {
	    dark : 2,
	    light : 2,
	    empty : 60
	},
	groupId : group,
	gameOn : false
    }

    saveGames()
}

module.exports.addPlayer = function(game,nick){
    let answer = {};
    
    if(game in games){
	let gameObj = games[game];
	if(!gameObj.gameOn){
	    if(Object.keys(gameObj.players).length == 0){
		gameObj.players.dark = nick;
	    }else{
		gameObj.players.light = nick;
		gameObj.gameOn = true;		
	    }
	    answer = gameObj;
	}else{
	    answer.error = "Game in progress\n";
	}

	saveGames()
    }else{
	answer.error = "Invalid game reference\n";
    }

    return answer;
}

module.exports.leaveGame = leaveGame;

module.exports.play = function(game,nick,move){
    let answer = {};
    
    if(game in games){
	let gameObj = games[game];
	if(gameObj.gameOn){
	    if(gameObj.players[gameObj.turn] === nick){
		if(move == null){
		    const noMoves = cantPlay(gameObj,gameObj.turn);
		    if(noMoves){
			const nextTurn = (gameObj.turn === "dark") ? "light" : "dark";
			gameObj.turn = nextTurn;
			answer.turn = gameObj.players[nextTurn];
			answer.board = gameObj.board;
			answer.count = gameObj.counter;

			saveGames()
		    }else{
			answer.error = "There are available moves\n";
		    }
		}else if(isValid(gameObj,move.row,move.column,gameObj.turn,true)){
		    gameObj.board[move.row][move.column] = gameObj.turn;
		    gameObj.counter[gameObj.turn]++;
		    gameObj.counter.empty--;
		    const darkOut = cantPlay(gameObj,"dark");
		    const lightOut = cantPlay(gameObj,"light");
		    if(darkOut && lightOut){
			const wColor = (gameObj.counter.dark > gameObj.counter.light) ? "dark"
			             : (gameObj.counter.dark < gameObj.counter.light) ? "light"
			      : null;
			if(wColor != null){
			    const loser = (wColor === "dark") ? "light" : "dark";
			    answer.winner = gameObj.players[wColor];
			    answer.loser = gameObj.players[loser];
			}else
			    answer.winner = null;
		    }else if(darkOut || lightOut){
			answer.skip = true;
		    }
		    const nextTurn = (gameObj.turn === "dark") ? "light" : "dark";
		    gameObj.turn = nextTurn;
		    answer.turn = gameObj.players[nextTurn];
		    answer.board = gameObj.board;
		    answer.count = gameObj.counter;

		    saveGames()
		}else{
		    answer.error = "Invalid move\n";
		}
	    }else{
		answer.error = "Not your turn to play\n";
	    }
	}else{
	    answer.error = "Game hasn't started yet\n";
	}
    }else{
	answer.error = "Invalid game reference\n";
    }

    return answer;
}

function isValid(game,x,y,curr,proc){
    if(game.board[x][y] != "empty")
	return false;

    let result = false;

    for(let i=-1;i<=1;i++){
	for(let j=-1;j<=1;j++){
	    if(j == 0 && i == 0)
		continue;
	    let check = checkLine(game,x,y,i,j,curr,proc);
	    result = result || check;
	}
    }

    return result;   
}

function checkLine(game,x,y,v,h,curr,proc){
    let board = game.board;
    
    let noEmpty = true; 
    let hasEnemy = false; 
    let hasOwn = false;   

    let dstX = 0;
    let dstY = 0;
    
    for(let i=x+v,j=y+h;i>=0&&i<8&&j>=0&&j<8;i+=v,j+=h){
	if(board[i][j] === "empty"){
	    noEmpty =  false;
	    break;
	}else if(board[i][j] != curr && board[i][j] != "empty"){
	    hasEnemy = true;
	}else if(board[i][j] === curr && hasOwn == false){
	    hasOwn = true;
	    dstX = i;
	    dstY = j;
	    break;
	}
    }

    if(proc && noEmpty && hasEnemy && hasOwn){
	process(game,curr,x,y,dstX,dstY,v,h);
    }
    
    return noEmpty && hasEnemy && hasOwn;   
}

function process(game,color,x,y,dstX,dstY,v,h){
    const opp = (color === "light") ? "dark" : "light";
    
    for(let i=x+v,j=y+h;i!=dstX || j!=dstY;i+=v,j+=h){
	game.counter[color]++;
	game.counter[opp]--;
	game.board[i][j] = color;
    }
}

function cantPlay(game,curr){
    for(let i=0;i<8;i++)
	for(let j=0;j<8;j++)
	    if(game.board[i][j] === "empty" && isValid(game,i,j,curr,false))
		return false;

    return true;    
}

function leaveGame(game,nick){
    let answer = {};
    
    if(game in games){
	let gameObj = games[game];
	if(gameObj.gameOn){
	    if(nick == null){
		answer.group = gameObj.groupId;
		delete games[game];
	    }else{
		const nextTurn = (gameObj.turn === "dark") ? "light" : "dark";
		if(gameObj.players[gameObj.turn] === nick){
		    answer.winner = gameObj.players[nextTurn];
		    answer.loser = gameObj.players[gameObj.turn];
		    answer.group = gameObj.groupId;
		    delete games[game];
		}else if(gameObj.players[nextTurn] === nick){
		    answer.winner = gameObj.players[gameObj.turn];
		    answer.loser = gameObj.players[nextTurn];
		    answer.group = gameObj.groupId;
		    delete games[game];
		}else
		    answer.error = "Invalid nick\n";
	    }
	}else{
	    answer.winner = null;
	    answer.group = gameObj.groupId;
	    delete games[game];
	}

	saveGames()
    }
    
    return answer;
}

function getGames(){
    fs.readFile(path,function(err,data){
	if(!err){
	    games = JSON.parse(data.toString());
	}else{ console.log(err); }
    });
}

function saveGames(){
    fs.writeFile(path,JSON.stringify(games),function(err){
	if(err)
	    console.log(err);
    });
}
