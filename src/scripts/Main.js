window.onload = function() {

    if(!localStorage.getItem("data")){
	const data = {
	    "wins": 0,
	    "loses": 0,
	    "ties": 0
	};
	localStorage.setItem("data",JSON.stringify(data));
    }
    
    const othello = new Othello();
    
}

class Othello{
    constructor(){
	this.board = new Array(8);
	this.gameInstance = null;
	this.nick = null;
	this.pwd = null;
	this.group = null;

	const parent = document.getElementById("game");
	const board = document.createElement("div");
	
	board.className = "board";
	parent.appendChild(board);
	
	for(let i=0;i<8;i++){
	    this.board[i] = new Array(8);
	}
	
	for(let i=0;i<8;i++){
	    for(let j=0;j<8;j++){		
		if((i==3 && j==3) || (i==4 && j==4)){
		    this.board[i][j] = new Cell('W');
		    this.board[i][j].placePiece('W');
		}else if((i==3 && j==4) || (i==4 && j==3)){
		    this.board[i][j] = new Cell('B');
		    this.board[i][j].placePiece('B');
		}else{
		    this.board[i][j] = new Cell('E');
		    this.board[i][j].placePiece('E');
		}
		
		board.appendChild(this.board[i][j].canvas);
	    }	
	}
	
	const start = document.getElementById("start");
	start.onclick = this.startGame.bind(this);

	const submit = document.getElementById("submit");
	submit.addEventListener("click",(async () => {
	    const n = document.getElementById("nick").value;
	    const p = document.getElementById("pwd").value;
	    const g = document.getElementById("group").value;
	    let data =
		{ "nick" : n,
		  "pass" : p
		};
	    const url = "http://twserver.alunos.dcc.fc.up.pt:8126/register";
    
	    fetch(url,{
		method: "POST",
		body: JSON.stringify(data)
	    })
		.then(status)
		.then(data => {
		    this.nick = n;
		    this.pwd = p;
		    this.group = g;
		    switchAutent(n);
		})
		.catch(printMessage);
	}));

	const logout = document.getElementById("logout");
	logout.addEventListener("click",(() => {
	    this.nick = null;
	    this.pwd = null;
	    this.group = null;
	    switchAutent(null);
	}));

	const rank = document.getElementById("rank");
	rank.addEventListener("click",(() => showRank()));

	const solo = document.getElementById("solo");
	solo.addEventListener("click",(() => showSolo()));
    }

    startGame(){

	const single = document.getElementsByName("SoM");
	const colors = document.getElementsByName("col");
	const difficulty = document.getElementsByName("diff");
	
	if(single[0].checked){
	    this.clearBoard();
	    this.gameInstance = new Singleplayer(this.board,colors,difficulty);
	}else{
	    this.gameInstance = new Multiplayer(this.board,this.nick,this.pwd,this.group);
	}
	
    }

    clearBoard(){
	
	for(let i=0;i<8;i++){
	    for(let j=0;j<8;j++){		
		if((i==3 && j==3) || (i==4 && j==4)){
		    this.board[i][j].placePiece('W');
		}else if((i==3 && j==4) || (i==4 && j==3)){
		    this.board[i][j].placePiece('B');
		}else{
		    this.board[i][j].placePiece('E');;
		}
	    }
	}
	
    }
}
