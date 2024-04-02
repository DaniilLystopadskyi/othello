class Multiplayer{
    constructor(board,nick,pwd,group){
	this.board = board;
	this.gameOn = false;
	this.playerColor = null;
	this.source = null;
	this.group = group;
	this.game = null;
	this.nick = nick;
	this.pwd = pwd;
	this.hasSurr = false;
	this.connected = false;
	this.animation = null;
	
	for(let i=0;i<8;i++)
	    for(let j=0;j<8;j++)
		this.board[i][j].canvas.onclick = ((fun,x,y) => {return () => fun(x,y);})(this.playMulti.bind(this),i,j);

	let url = "http://twserver.alunos.dcc.fc.up.pt:8126/join"
	let data =
	    { "group" : this.group,
	      "nick" : this.nick,
	      "pass" : this.pwd
	    };
	
	fetch(url,{
	    method: "POST",
            body: JSON.stringify(data)
	})
	    .then(status)
	    .then(data => {
		this.game = data.game;
		this.gameOn = true;
		this.playerColor = data.color;
		url = "http://twserver.alunos.dcc.fc.up.pt:8126/update?nick=" + this.nick + "&game=" + this.game;
		const wait = document.getElementById("waiting");
		const waitCanv = document.getElementById("waitingCanvas");
		stop = false;
		wait.style.display = "block";
		waitCanv.style.display = "block";
		this.animation = requestAnimationFrame(draw);
		this.source = new EventSource(url);
		this.source.onmessage = (event => {
		    console.log(event.data);
		    if(!this.connected){
			this.connected = true;
			const wait = document.getElementById("waiting");
			const waitCanv = document.getElementById("waitingCanvas");
			wait.style.display = "none";
			waitCanv.style.display = "none";
			stop = true;
			cancelAnimationFrame(this.animation);
		    }
		    const resp = JSON.parse(event.data);
		    this.updateGame(resp);
		});
	    })
	    .catch(printMessage);
		 
	const surr = document.getElementById("surrender");
	surr.addEventListener("click",(() => {
	    if(this.gameOn){
		const url = "http://twserver.alunos.dcc.fc.up.pt:8126/leave"
		let data =
		    { "nick" : this.nick,
		      "pass" : this.pwd,
		      "game" : this.game,
		    };
		fetch(url,{
		    method: "POST",
		    body: JSON.stringify(data)
		})
		    .then(status)
		    .catch(printMessage);
	    }
	}));

	const pass = document.getElementById("pass");
	pass.addEventListener("click",(async () => {
	    if(this.gameOn){
		const url = "http://twserver.alunos.dcc.fc.up.pt:8126/notify"
		let data =
		    { "nick" : this.nick,
		      "pass" : this.pwd,
		      "game" : this.game,
		      "move" : null
		    };
		fetch(url,{
		    method: "POST",
		    body: JSON.stringify(data)
		})
		    .then(status)
		    .catch(printMessage);
	    }
	}));
    }

    playMulti(x,y){

	if(this.gameOn){
	    const url = "http://twserver.alunos.dcc.fc.up.pt:8126/notify"
	    let data =
		{ "nick" : this.nick,
		  "pass" : this.pwd,
		  "game" : this.game,
		  "move" : {"row" : x, "column" : y}
		};
	    
	    fetch(url,{
		method: "POST",
		body: JSON.stringify(data)
	    })
		.then(status)
		.catch(printMessage);
	}
	
    }

    updateGame(data){
	
	if(this.gameOn){
	    if("board" in data)
		this.updateBoard(data.board);
	    if("count" in data)
		this.updateCounter(data.count.light,data.count.dark,data.count.empty);
	    if("turn" in data){
		if(data.turn === this.nick){
		    printMessage("YOUR TURN");
		}else{
		    printMessage("OTHER PLAYER TURN");
		}
	    }
	    if("winner" in data){
		this.endMulti(data.winner);
	    }
	}
	
    }

    updateBoard(newBoard){
	
	for(let i=0;i<8;i++){
	    for(let j=0;j<8;j++){
		let piece = '';
		if(newBoard[i][j] === "light")
		    piece = 'W';
		else if(newBoard[i][j] === "dark")
		    piece = 'B';
		else
		    piece = 'E';
		this.board[i][j].placePiece(piece);
	    }
	}
	
    }

    updateCounter(light,dark,empty){

	document.getElementById("whiteCount").innerHTML = light;  //atualizamos os elementos
	document.getElementById("blackCount").innerHTML = dark;
	document.getElementById("emptyCount").innerHTML = empty;
	
    }

    endMulti(winner){

	if(winner == null)
	    printMessage("DRAW");
	else
	    printMessage("WINNER: " + winner);

	this.gameOn = false;
	this.source.close();
	
    }
}

async function showRank(){

    const table = document.getElementById("rankTable");
    
    const url = "http://twserver.alunos.dcc.fc.up.pt:8126/ranking";
    
    fetch(url,{
	method: "POST",
        body: "{}"
    })
	.then(status)
	.then(data => {
	    let index = 2;
	    for(let entry of data.ranking){
		const nick = entry.nick;
		const victories = entry.victories;
		const games = entry.games;
		
		let cells = table.rows[index].cells;
		cells[0].innerHTML = nick;
		cells[1].innerHTML = victories;
		cells[2].innerHTML = games;

		index++;
	    }
	})
	.catch(printMessage);
    
}

async function status(response){

    let message = await response.json();
    
    if('error' in message)
	throw new Error(message.error);
    else
	return message;

}
