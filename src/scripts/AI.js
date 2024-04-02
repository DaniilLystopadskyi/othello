class AI{
    constructor(game){
	this.game = game;
	this.bestMove = null;
    }

    // funçao que inicia a jogada e retorna a posiçao escolhida pelo aloritmo
    playAI(depth){

	let boardClone = new Array(8);

	for(let i=0;i<8;i++)
	    boardClone[i] = new Array(8);

	for(let i=0;i<8;i++)
	    for(let j=0;j<8;j++)
		boardClone[i][j] = this.game.board[i][j].color;

	this.bestMove = null;	
	this.minimax(depth,boardClone,-1000,1000,true);

	return this.bestMove;

    }

    // algoritmo minimax com alpha beta pruning
    minimax(depth,board,a,b,isMax){

	// se chegamos a profundidade 0 ou o jogo ja tem acabado retornamos "score" do tabuleiro atual
	if(depth == 0 || this.isGameOver(board)){
	    return this.score(board);
	}

	if(isMax){ // se for o jogador maximizador
	    let moves = this.findMoves(board,this.game.opponentPiece,this.game.playerPiece); // geramos todas as possiveis jogadas
	    if(moves.length == 0)
		return 0;
	    
	    let bestValue = -1000;
	    
	    for(let move of moves){ // para cada possivel jogada
		let newBoard = this.simulateMove(board,move,this.game.opponentPiece,this.game.playerPiece); // simulamos o tabuleiro
		let v = this.minimax(depth-1,newBoard,a,b,!isMax); // recursivamente chamamos a funçao minimax para o tabuleiro gerado e para o jogador minimizador
		if(v > bestValue){ // se o valor obtido dessa jogada for superior ao melhor valor atual, registamos
		    bestValue = v;
		    if(depth == this.game.maxDepth)
			this.bestMove = move;
		}
		// alpha-beta pruning. se alpha for maior que beta "podamos" a arvore
		a = Math.max(a,bestValue);
		if(a >= b)
		    break;
	    }
	    return bestValue;
	}else{ // se for o jogador minimizador, fazemos o contrario
	    let moves = this.findMoves(board,this.game.playerPiece,this.game.opponentPiece);
	    if(moves.length == 0)
		return 0;
	    
	    let bestValue = 1000;
	    
	    for(let move of moves){
		let newBoard = this.simulateMove(board,move,this.game.playerPiece,this.game.opponentPiece);
		let v = this.minimax(depth-1,newBoard,a,b,!isMax);
		if(v < bestValue){
		    bestValue = v;
		}
		b = Math.min(b,bestValue);
		if(b <= a)
		    break;
	    }
	    return bestValue;
	}
	    
    }

    // verifica se algum dos jogadores nao pode jogar
    isGameOver(board){
	
	let a = this.findMoves(board,this.game.opponentPiece,this.game.playerPiece);
	let b = this.findMoves(board,this.game.playerPiece,this.game.opponentPiece);

	if(a.length == 0 && b.length == 0)
	    return true;

	return false;
	
    }

    // devolve o conjunto de posiçoes onde é possivel jogar
    findMoves(board,c,w){

	let moves = new Array();

	for(let i=0;i<8;i++){
	    for(let j=0;j<8;j++){
		if(board[i][j] == 'E' && this.simIsValid(board,i,j,false,c,w)){
		    moves.push(new Point(i,j));
		}
	    }
	}

	return moves;
	
    }

    // simula uma jogada e retorna o tabuleiro resultante
    simulateMove(board,move,c,w){

	let newBoard = new Array(8);
	for(let i=0;i<8;i++)
	    newBoard[i] = new Array(8);

	for(let i=0;i<8;i++)
	    for(let j=0;j<8;j++)
		newBoard[i][j] = board[i][j];

	this.simIsValid(newBoard,move.x,move.y,true,c,w);

	return newBoard;
	
    }

    // numero de peças do computador - numero de peças do jogador
    score(board){
	
	return this.countPieces(board,this.game.opponentPiece) - this.countPieces(board,this.game.playerPiece);
	
    }

    // conta o numero de certas peças no tabuleiro
    countPieces(board,piece){

	let count = 0;

	for(let i=0;i<8;i++)
	    for(let j=0;j<8;j++)
		if(board[i][j] == piece)
		    count++;

	return count;
	
    }

    // simula a funçao "isValid" da classe "Othello"
    simIsValid(board,x,y,proc,curr,w){

	if(board[x][y] != 'E')
	    return false;

	let a = this.simCheckLine(board,x,y,1,0,proc,curr,w);
	let b = this.simCheckLine(board,x,y,-1,0,proc,curr,w);
	let c = this.simCheckLine(board,x,y,0,1,proc,curr,w);
	let d = this.simCheckLine(board,x,y,0,-1,proc,curr,w);
	let e = this.simCheckLine(board,x,y,1,1,proc,curr,w);
	let f = this.simCheckLine(board,x,y,-1,-1,proc,curr,w);
	let g = this.simCheckLine(board,x,y,1,-1,proc,curr,w);
	let h = this.simCheckLine(board,x,y,-1,1,proc,curr,w);

	return a || b || c || d || e || f || g || h;
	
    }

    // simula a funçao "CheckLine" da classe "Othello"
    simCheckLine(board,x,y,v,h,proc,curr,wtg){

	let noEmpty = true;
	let hasEnemy = false;
	let hasOwn = false;

	let dstX = 0;
	let dstY = 0;
	    
	for(let i=x+v,j=y+h;i>=0&&i<8&&j>=0&&j<8;i+=v,j+=h){
	    if(board[i][j] == 'E'){
		noEmpty =  false;
		break;
	    }else if(board[i][j] == wtg){
		hasEnemy = true;
	    }else if(board[i][j] == curr && hasOwn == false){
		hasOwn = true;
		dstX = i;
		dstY = j;
		break;
	    }
	}

	if(proc && noEmpty && hasEnemy && hasOwn){
	    this.simProcess(board,x,y,dstX,dstY,v,h,curr);
	}
	
	return noEmpty && hasEnemy && hasOwn;
	
    }

    // simula a funçao "process" da classe "Othello"
    simProcess(board,x,y,dstX,dstY,v,h,player){

	for(let i=x+v,j=y+h;i!=dstX || j!=dstY;i+=v,j+=h){
	    board[i][j] = player;
	}

	board[x][y] = player;
	
    }

}
