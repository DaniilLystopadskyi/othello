var responses = {};

module.exports.remember = function(response,game) {
    if(game in responses){
	if(responses[game].length < 2)
	    responses[game].push(response);
    }else{
	responses[game] = [response];
    }
}

module.exports.forget = function(response,game) {
    let pos = responses[game].findIndex((resp) => resp === response);
    if(pos > -1)
	responses[game].splice(pos,1);

    //saveResponses()
}

module.exports.update = function(game,object){
    if(game in responses){
	for(let response of responses[game]) {
            response.write("data: " + JSON.stringify(object) + '\n\n');
	}
    }
}

/*function getResponses(){
    fs.readFile(path,function(err,data){
	if(!err){
	    responses = JSON.parse(data.toString());
	}else{ console.log(err); }
    });
}

function saveResponses(){
    fs.writeFile(path,JSON.stringify(responses),function(err){
	if(err)
	    console.log(err);
    });
}*/
