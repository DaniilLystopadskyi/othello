class Singleplayer{
    constructor(board,colors,difficulty){
	this.board = board;
	this.gameOn = true;
	this.counter = new Map();
	
	this.ai = new AI(this);
	this.maxDepth = 0;

	this.playerPiece = 'W';    // representa a cor do jogador
	this.opponentPiece = 'B';  // representa a cor do adversario
	this.currPlayer = 'W';  // cor do jogador atual
	this.waitPlayer = 'B';  // cor do jogador que está a espera
	
	if(difficulty[0].checked)
	    this.maxDepth = 2;
	else
	    this.maxDepth = 6;
	this.counter.set('W',2);
	this.counter.set('B',2);
	this.counter.set('E',60);
	
	for(let i=0;i<8;i++)
	    for(let j=0;j<8;j++)
		this.board[i][j].canvas.onclick = ((fun,x,y) => {return () => fun(x,y,true);})(this.playSingle.bind(this),i,j);

	if(colors[0].checked){
	    this.playerPiece = 'W';
	    this.opponentPiece = 'B';
	    this.currPlayer = 'B';
	    this.waitPlayer = 'W';
	    
	    setTimeout(() => {
		let aiMove = this.ai.playAI(this.maxDepth);
		this.playSingle(aiMove.x,aiMove.y,false);
	    },1000);
	}else{
	    this.playerPiece = 'B';
	    this.opponentPiece = 'W';
	    this.currPlayer = 'B';
	    this.waitPlayer = 'W';
	}

	const surr = document.getElementById("surrender");
	surr.addEventListener("click",(() => {
	    if(this.gameOn){
		let data = JSON.parse(localStorage.getItem("data"));
		data.loses++;
		localStorage.setItem("data",JSON.stringify(data));
		this.endSingle(this.opponentPiece);
	    }else
		printMessage("GAME NOT STARTED");
	}));

	const pass = document.getElementById("pass");
	pass.addEventListener("click",(() => {
	    if(this.gameOn){
		if(this.currPlayer == this.playerPiece && this.cantPlay(this.playerPiece,this.opponentPiece)){
		    let aiMove = this.ai.playAI(this.maxDepth);
		    this.play(aiMove.x,aiMove.y,false);
		}
	    }else
		printMessage("GAME NOT STARTED");
	}));
    }

    playSingle(x,y,isPlayer){
	
	if(this.gameOn){	    
		
	    if(this.isValid(x,y,this.currPlayer,this.waitPlayer,true)){  // se for uma posicao valida, colocamos uma peça nessa posicao
		this.gameOn = false;
		setTimeout(() => {
		    this.gameOn = true;
		},800);
		this.board[x][y].placePiece(this.currPlayer);
		let canPlay = !this.cantPlay(this.opponentPiece,this.playerPiece);
		// atualizamos o contador
		this.counter.set(this.currPlayer,this.counter.get(this.currPlayer)+1);
		this.counter.set('E',this.counter.get('E')-1);
		if(!(isPlayer&&!canPlay)){
		    if(this.currPlayer == 'W'){    // trocamos de jogador atual
			this.currPlayer = 'B';
			this.waitPlayer = 'W';
		    }else{
			this.currPlayer = 'W';
			this.waitPlayer = 'B';
		    }
		}
		document.getElementById("whiteCount").innerHTML = this.counter.get('W');  //atualizamos os elementos
		document.getElementById("blackCount").innerHTML = this.counter.get('B');
		document.getElementById("emptyCount").innerHTML = this.counter.get('E');
		let color = "WHITE";
		if(this.currPlayer == 'B')
		    color = "BLACK";
		printMessage(color + " TURN");
		
		// verificamos se o jogo tem acabado
		if(this.gameOver()){
		    this.gameOn = false;
		    let data = JSON.parse(localStorage.getItem("data"));
		    
		    if(this.counter.get('W') > this.counter.get('B')){
			if(this.playerPiece == 'W'){
			    data.wins++;
			}else{
			    data.loses++;
			}
			this.endSingle('W');
		    }else if(this.counter.get('W') < this.counter.get('B')){
			if(this.playerPiece == 'B'){
			    data.wins++;
			}else{
			    data.loses++;
			}
			this.endSingle('B');
		    }else{
			data.ties++;
			this.endSingle('E');
		    }

		    localStorage.setItem("data",JSON.stringify(data));
		    return;
		}
		
		if(isPlayer && canPlay){  // se for o jogador a fazer a jogada entao o computador joga a seguir
		    setTimeout(() => {
			let aiMove = this.ai.playAI(this.maxDepth);
			this.playSingle(aiMove.x,aiMove.y,false);
		    },1000);
		}
	    }else{  // caso a posicao seja invalida
		printMessage("INVALID POSITION");	   
	    }		
	    
	}else{  // se a partida estiver terminada nao podemos colocar peças
	    
	    printMessage("Can't do that yet");
	    
	}
    }

    // funçao que verifica se uma dada posiçao é valida para ser jogada em todos os sentidos possiveis
    isValid(x,y,curr,wtg,proc){

	if(this.board[x][y].color != 'E')
	    return false;

	let a = this.checkLine(x,y,1,0,curr,wtg,proc);   // vertical, cima -> baixo
	let b = this.checkLine(x,y,-1,0,curr,wtg,proc);  // vertical, baixo -> cima
	let c = this.checkLine(x,y,0,1,curr,wtg,proc);   // horizontal, esquerda -> direita
	let d = this.checkLine(x,y,0,-1,curr,wtg,proc);  // horizontal, direita -> esquerda
	let e = this.checkLine(x,y,1,1,curr,wtg,proc);   // diaginal, cima -> baixo, esquerda -> direita
	let f = this.checkLine(x,y,-1,-1,curr,wtg,proc); // diagonal, baixo -> cima, direita -> esquerda
	let g = this.checkLine(x,y,1,-1,curr,wtg,proc);  // diagonal, cima -> baixo, direita -> esquerda
	let h = this.checkLine(x,y,-1,1,curr,wtg,proc);  // diagonal, baixo -> cima, esquerda -> direita

	return a || b || c || d || e || f || g || h;
	
    }

    // verifica um dado sentido
    checkLine(x,y,v,h,curr,wtg,proc){

	// 3 criterios que determinam se uma peça pode ser colocada numa dada posiçao ou nao
	let noEmpty = true;   // nao pode haver celulas vazias no caminha
	let hasEnemy = false; // o caminho tem que ter pelo menos uma peça do adversario
	let hasOwn = false;   // no final do caminho tem que haver uma peça do jogador atual

	let dstX = 0;  // coordenadas 
	let dstY = 0;
	    
	for(let i=x+v,j=y+h;i>=0&&i<8&&j>=0&&j<8;i+=v,j+=h){
	    if(this.board[i][j].color == 'E'){
		noEmpty =  false;
		break;
	    }else if(this.board[i][j].color == wtg){
		hasEnemy = true;
	    }else if(this.board[i][j].color == curr && hasOwn == false){
		hasOwn = true;
		dstX = i;
		dstY = j;
		break;
	    }
	}

	if(proc && noEmpty && hasEnemy && hasOwn){
	    this.process(x,y,dstX,dstY,v,h);
	}
	
	return noEmpty && hasEnemy && hasOwn;
	
    }

    // funçao que "vira" todas as peças do adversario ao longo do caminho
    process(x,y,dstX,dstY,v,h){

	for(let i=x+v,j=y+h;i!=dstX || j!=dstY;i+=v,j+=h){
	    this.counter.set(this.waitPlayer,this.counter.get(this.waitPlayer)-1);
	    this.counter.set(this.currPlayer,this.counter.get(this.currPlayer)+1);
	    this.board[i][j].placePiece(this.currPlayer);
	}
	
    }

    // diz se algum dos jogadores pode jogar
    gameOver(){
	
	let a = this.cantPlay(this.currPlayer,this.waitPlayer);	
	let b = this.cantPlay(this.waitPlayer,this.currPlayer);

	return a && b;
	
    }

    // diz se é impossivel jogar
    cantPlay(curr,wtg){

	for(let i=0;i<8;i++)
	    for(let j=0;j<8;j++)
		if(this.board[i][j].color == 'E' && this.isValid(i,j,curr,wtg,false))
		    return false;

	return true;
	
    }

    endSingle(winner){

	switch(winner){
	case 'W':
	    printMessage("WHITE WINS");
	    break;
	case 'B':
	    printMessage("BLACK WINS");
	    break;
	case 'E':
	    printMessage("TIE");
	    break;
	}

	this.gameOn = false;
	
    }
    
}
