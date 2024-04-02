// funçao que "esconde" todos os paineis temporarios
function hideScreens(){
    let a = document.getElementById("instr");
    let b = document.getElementById("config");
    let c = document.getElementById("score");
    let d = document.getElementById("soloRank");
    let e = document.getElementById("game");

    a.style.display = "none";
    b.style.display = "none";
    c.style.display = "none";
    d.style.display = "none";
    e.style.display = "none";
}

// funçao que abre um dado painel
function openWindow(window){
    hideScreens();
    let x = document.getElementById(window);
    x.style.display = "block";
}

function switchAutent(nick){
    let r = document.getElementById("req");
    let s = document.getElementById("succ");

    if(r.style.display === "block"){
	r.style.display = "none";
	s.style.display = "block";
	let n = document.getElementById("loged");
	n.innerHTML = "User:&nbsp&nbsp&nbsp&nbsp&nbsp" + nick +"&nbsp&nbsp";
    }else{
	s.style.display = "none";
	r.style.display = "block";
    }
}

var degree = 0;
var stop = false;

function draw(){
    const wait = document.getElementById("waitingCanvas");
    const context = wait.getContext("2d");
    const size = wait.width;
    context.clearRect(0,0,wait.width,wait.width);
    context.save();
    context.strokeStyle = "black";
    context.lineWidth = 20;
    context.beginPath();
    context.translate(size/2, size/2);
    context.rotate(degree*Math.PI/180);
    context.arc(0, 0, (size/2)-20, -Math.PI/2, 1.0 * Math.PI, false);
    context.stroke();

    context.restore();

    degree += 10;
    if(degree > 360)
	degree = 0;

    if(!stop)
	requestAnimationFrame(draw);
}

function showSolo(){

    const table = document.getElementById("soloTable");
    const cells  = table.rows[2].cells;

    const data = JSON.parse(localStorage.getItem("data"));
    cells[0].innerHTML = data.wins;
    cells[1].innerHTML = data.loses;
    cells[2].innerHTML = data.ties;
    
}

function printMessage(message){

    const msg = document.getElementById("message");
    msg.innerHTML = message;
    flashColor(msg);
	
}

function flashColor(obj){
    let tmp = obj.style.color;
    obj.style.color = "red";
    setTimeout(function() {
	obj.style.color = tmp;
    },100);
}
