// classe que representa uma celula do tabuleiro
class Cell{
    constructor(color,x,y,width){
	let canvas = document.createElement("canvas");
	canvas.className = "cell";
	canvas.width = 66;
	canvas.height = 66;
	
	this.color = color;
	this.canvas = canvas;

	this.amount = 0;
	this.amountToIncrease = 5;
	this.animation;
    }

    placePiece(player){
	const context = this.canvas.getContext("2d");
	const size = this.canvas.width;
	context.fillStyle = "green";
	context.fillRect(0,0,size,size);
	
	if(player == 'W'){
	    if(this.color != 'E'){
		if(this.color == 'W')
		    context.fillStyle = "white";
		else
		    context.fillStyle = "black";
		context.beginPath();
		context.arc(size/2,size/2,size/2,0,2*Math.PI);
		context.fill();
		context.closePath();
		this.animation = setInterval(() => this.animate("white"),15);
	    }else{
		context.fillStyle = "white";
		context.beginPath();
		context.arc(size/2,size/2,size/2,0,2*Math.PI);
		context.fill();
		context.closePath();
	    }
	}else if(player == 'B'){
	    if(this.color != 'E'){
		if(this.color == 'W')
		    context.fillStyle = "white";
		else
		    context.fillStyle = "black";
		context.beginPath();
		context.arc(size/2,size/2,size/2,0,2*Math.PI);
		context.fill();
		context.closePath();
		this.animation = setInterval(() => this.animate("black"),15);
	    }else{
		context.fillStyle = "black";
		context.beginPath();
		context.arc(size/2,size/2,size/2,0,2*Math.PI);
		context.fill();
		context.closePath();
	    }
	}

	this.color = player;
    }

    animate(color){
	const context = this.canvas.getContext("2d");
	const size = this.canvas.width;
	context.save();
	context.beginPath();
	context.arc(size/2,size/2,size/2,0,2*Math.PI,false);
	context.clip();
	context.fillStyle = color;
	context.fillRect(0,size,size,-this.amount);
	context.restore();

	this.amount += this.amountToIncrease;
	if(this.amount > this.canvas.width+5){
	    this.amount = 0;
	    clearInterval(this.animation);
	}
    }
}
