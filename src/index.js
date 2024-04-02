"use strict";

const headers = {
    plain: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*'        
    },
    sse: {    
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*',
        'Connection': 'keep-alive'
    }
};

var timeouts = {};

// strings com erros comuns (400,404,etc)
const notFound = JSON.stringify({"error" : "Unrecognized command"});
const badRequest = JSON.stringify({"error" : "Bad request"});
const notImplemented = JSON.stringify({"error" : "Not implemented"});

const http   = require("http");
const url    = require("url");
const fs     = require("fs");
const conf   = require("./server/config.js");
const updater = require("./server/updater.js");
const manager = require("./server/gameManager.js");
const users  = require("./server/userManager.js");
const rank   = require("./server/rankManager.js");
const groups = require("./server/groupManager.js");
const st     = require("./server/staticContent.js");

http.createServer(function (request, response) {
    const preq = url.parse(request.url,true);
    const pathname = preq.pathname;
    
    switch(request.method) {
    case "GET":
        doGet(preq,request,response);
        break;
    case "POST":
        doPost(pathname,request,response);
	break;
    default:
	sendResponse(response,notImplemented,501,"plain");
	break;
    }

}).listen(conf.port);

// processa o método GET
function doGet(parsed,request,response) { 
    if(parsed.pathname === "/update"){
	const query = parsed.query;
	if(okArgs("/update",query)){
	    const json = manager.addPlayer(query.game,query.nick);
	    if("error" in json){
		sendResponse(response,JSON.stringify(json),400,"plain");
	    }else{
		updater.remember(response,query.game);
		response.writeHead(200, headers.sse);
		setImmediate(() => updater.update("{}")); 
		request.on('close', () => {
		    updater.forget(response,query.game);
		    const json = manager.leaveGame(query.game,query.nick);
		    if("group" in json)
			groups.removeGroup(json.group);
		});
		if(json.gameOn){
		    updater.update(query.game,{
			"turn" : json.players["dark"],
			"board" : json.board,
			"count" : json.counter
		    });

		    timeouts[query.game] = setTimeout(() => {
			const ans = manager.leaveGame(query.game, query.nick);
			updater.update(query.game,{"winner" : ans.winner});
			groups.removeGroup(ans.group);
			if(("winner" in ans) && ans.winner != null){
			    rank.incGames(ans.winner,true);
			    rank.incGames(ans.loser,false);
			}
		    }, 120000);
		}
	    }
	}else{
	    sendResponse(response,badRequest,400,"plain");
	}
    }else{
	const pathname = st.getPathname(request);
	if(pathname === null) {
            response.writeHead(403); // Forbidden
            response.end();
	} else 
            fs.stat(pathname,(err,stats) => {
		if(err) {
                    response.writeHead(500); // Internal Server Error
                    response.end();
		} else if(stats.isDirectory()) {
                    if(pathname.endsWith('/'))
			st.doGetPathname(pathname+conf.defaultIndex,response);
                    else {
			response.writeHead(301, // Moved Permanently
					   {'Location': pathname+'/' });
			response.end();
                    }
		} else 
                    st.doGetPathname(pathname,response);
	    }); 
    }
}

// processa o método POST
function doPost(pathname,request,response) {
    let fun = null;   // função que processa o pedido
    let query = null; // json com os argumentos
    let body = "";
    
    switch(pathname) {
    case "/register":
	fun = doRegister;
	break;
    case "/join":
	fun = doJoin;
	break;
    case "/leave":
	fun = doLeave;
	break;
    case "/notify":
	fun = doNotify;
	break;
    case "/ranking":
	const json = JSON.stringify(rank.getTable());
	sendResponse(response,json,200,"plain");
	break;
    default:
	sendResponse(response,notFound,404,"plain");
	break;
    }

    // caso o pedido conter argumentos
    if(fun != null){
	request
	    .on("data", (chunk) => { body += chunk; })
	    .on("end" , () => {
		try {
		    query = JSON.parse(body);
		    if(okArgs(pathname,query)){
			fun(response,query);
		    }else{
			sendResponse(response,JSON.stringify({"error" : "Invalid arguments"}),400,"plain");
		    }
		}
		catch(err) { console.log(err); }
	    })
	    .on("error" , (err) => { console.log(err); });
    }

}

// envia a resposta ao cliente com os dados fornecidos
function sendResponse(response,object,status,style){
    response.writeHead(status, headers[style]);
    response.write(object);

    if(style === "plain")
	response.end();
}

// verifica os argumentos
function okArgs(pathname,query){
    if(query == null)
	return false;
    
    let result = true;
    
    switch(pathname){
    case "/register":
	result = Object.keys(query).length == 2 && hasPropType(query,"nick","string") && hasPropType(query,"pass","string");
	break;
    case "/join":
	result = Object.keys(query).length == 3 && hasPropType(query,"nick","string") && hasPropType(query,"pass","string") && hasPropType(query,"group","string");
	break;
    case "/leave":
	result = Object.keys(query).length == 3 && hasPropType(query,"nick","string") && hasPropType(query,"pass","string") && hasPropType(query,"game","string");
	break;
    case "/notify":
	result = Object.keys(query).length == 4 && hasPropType(query,"nick","string") && hasPropType(query,"pass","string") && hasPropType(query,"game","string");
	if(hasPropType(query,"move","object")){
	    if(query.move != null){
		if(hasPropType(query.move,"row","number") && hasPropType(query.move,"column","number")){
		    if(query.move.row > 7 || query.move.row < 0 || query.move.column > 7 || query.move.column < 0)
			result = false;
		}else{
		    result = false;
		}
	    }
	}else{
	    result = false;
	}
	break;
    case "/update":
	result = Object.keys(query).length == 2 && hasPropType(query,"game","string") && hasPropType(query,"nick","string");
	break;
    default:
	result = false;
	break;
    }

    return result;
}

// diz se um argumento está presente e se tem o tipo correto
function hasPropType(query,property,type){
    if(property in query){
	if(typeof(query[property]) != type)
	    return false;
    }else
	return false;

    return true;
}

// funções que processam os pedidos

function doRegister(response,query){
    const json = users.addUser(query.nick,query.pass);
    const status = ("error" in json) ? 400 : 200;

    sendResponse(response,JSON.stringify(json),status,"plain");
}

function doJoin(response,query){
    if(users.authorized(query.nick,query.pass)){
	const json = groups.assignGroup(query.group,query.nick);
	const status = ("error" in json) ? 400 : 200;

	if("color" in json)
	    if(json.color === "dark")
		manager.startGame(json.game,query.group);
	
	sendResponse(response,JSON.stringify(json),status,"plain");
    }else{
	sendResponse(response,JSON.stringify({"error" : "Unauthorized access"}),401,"plain");
    }
}

function doLeave(response,query){
    if(users.authorized(query.nick,query.pass)){
	const json = manager.leaveGame(query.game,query.nick);	

	if("error" in json){
	    sendResponse(response,JSON.stringify(json),400,"plain");
	}else{
	    sendResponse(response,"{}",200,"plain");
	    updater.update(query.game,{"winner" : json.winner});
	    groups.removeGroup(json.group);
	    if(("winner" in json) && json.winner != null){
		rank.incGames(json.winner,true);
		rank.incGames(json.loser,false);
	    }
	}
    }else{
	sendResponse(response,JSON.stringify({"error" : "Unauthorized access"}),401,"plain");
    }
}

function doNotify(response,query){
    const json = manager.play(query.game,query.nick,query.move);
    if("error" in json)
	sendResponse(response,JSON.stringify(json),400,"plain");
    else{
	clearTimeout(timeouts[query.game]);
	updater.update(query.game,json);
	sendResponse(response,"{}",200,"plain");
	if("winner" in json){
	    let ans = manager.leaveGame(query.game,null);
	    groups.removeGroup(ans.group);
	    if(json.winner != null){
		rank.incGames(json.winner,true);
		rank.incGames(json.loser,false);
	    }
	}else{
	    timeouts[query.game] = setTimeout(() => {
		const ans = manager.leaveGame(query.game, json.turn);
		updater.update(query.game,{"winner" : ans.winner});
		groups.removeGroup(ans.group);
		if(("winner" in ans) && ans.winner != null){
		    rank.incGames(ans.winner,true);
		    rank.incGames(ans.loser,false);
		}
	    }, 120000);
	}
    }
}
