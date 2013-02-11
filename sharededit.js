var express = require('express');
var app = express.createServer();

app.configure(function() {
    app.use(express.bodyParser());
    app.use(express.static('./static/'));
    app.use(app.router);
});
app.set('view engine', 'ejs');
app.set('view options', {
    layout: false
});

var sessions = {};

app.get('/', function(req, res) {
var editorId = "editor"+Math.floor((Math.random()*100000));
if(!sessions[editorId])sessions[editorId]={"life":{"1":{"content":""}},"lastVersion":"1"};
res.redirect('/'+editorId);
});


app.get(/^\/editor(\d)*(\/)?$/, function(req, res){

var editorId = req.url.replace(/\//g,'');
if(!sessions[editorId]){
res.setHeader("Content-Type", "text/html");
res.end('Editor not active');
}
else{
res.render('index', {
    message : editorId,
	version	: sessions[editorId]["lastVersion"],
    content : sessions[editorId]["life"][sessions[editorId]["lastVersion"]]["content"]
});

}
});

















app.post('/post',function(req,res){
	//	Get the version number from request.
	//	If version number is not present reject the update request.
	//	If version number is old	:	
	//		Merge the changes recieved with all the changes made after that version.
	//		If merge is not possible reject respective changes.
	//	If version number is recent	:	
	//		Put the changes in content and update version number.

	//console.log(req.body.text);
	setTimeout(function(){
	
	
	var editorId = req.body.editorId;
	if(!sessions[editorId]){
		//sessions[editorId]={};
		res.writeHead(404, { "Content-Type": "text/plain" });
		res.end("Session doesn't exists!");
		return;
	}else if(!req.body.version){
		res.writeHead(404, { "Content-Type": "text/plain" });
		res.end("Version not found. Request rejected!");
		return;
	}
	console.log("Current session is : "+sessions[editorId].connections.length);
	res.setHeader("Content-Type", "text/html");
	res.end("{\"version\":"+merge(editorId,req.body.version,req.body.text)+"}");

	sessions[editorId].content=req.body.text;
	sessions[editorId].startTime=new Date();
	//console.log(sessions[editorId]);
	
	setTimeout(function(){
		while(sessions[editorId].connections.length){
			(function(connection){
				//console.log("Inside respond");
				connection.writeHead(200, { "Content-Type": "text/plain" });
				connection.end("{\"version\":\""+sessions[editorId]["lastVersion"]+"\",\"text\":\""+sessions[editorId]["life"][sessions[editorId]["lastVersion"]].content+"\"}");
			})(sessions[editorId].connections.shift());
		}
	},0);
	
	},0);
});



// sessions = {"editor1234":{"life":[{"1":{guid,startIndex,endIndex,text.....}},
//					 {"2":{guid,startIndex,endIndex,text.....}}
//					]
//				},
//		"editor1235":{"life":[{"1":{guid,startIndex,endIndex,text.....}},
//					 {"2":{guid,startIndex,endIndex,text.....}}
//					]
//				}
//		}


// sessions = {"editor1234":{"life":{"1":{"content":text},
//					 				  "2":{"content":text}
//									}
//							},
//				"editor1235":{"life":{"1":{"content":text},
//					 				  "2":{"content":text}
//									 }
//							 }
//			  }


function merge(editorId,version,text){
	var newVersion=version;
	if(sessions[editorId]["lastVersion"]==version){
		//	Version is latest. Push the changes in life, with new version number.
		console.log();
		console.log("Inside merge : Latest version recieved "+version+": Pushing new version with text : ");
		console.log("Old Data : "+sessions[editorId]["life"][version]["content"]);
		newVersion = sessions[editorId]["lastVersion"] = (parseInt(version)+1)+"";
		sessions[editorId]["life"][newVersion]={};
		sessions[editorId]["life"][newVersion]["content"]=text;
		console.log("New Version : "+newVersion);
		console.log("New Data : "+sessions[editorId]["life"][newVersion]["content"]);
	}else if(parseInt(sessions[editorId]["lastVersion"])>version){
		//	Version is old. Merge the current changes with all the changes from later versions.
		//	Push the result changes in life, with new version number. Send rejected changes in response.  
		console.log();
		console.log("Inside merge : Old version recieved "+version+": Merging with old versions with recived text : ");
		console.log("Old Data : "+sessions[editorId]["life"][version]["content"]);
		console.log("Current version Data : "+sessions[editorId]["life"][sessions[editorId]["lastVersion"]]["content"]);
		newVersion = sessions[editorId]["lastVersion"] = parseInt(sessions[editorId]["lastVersion"])+1+"";
		sessions[editorId]["life"][newVersion]={};
		sessions[editorId]["life"][newVersion]["content"]=text;
		
		console.log("New Version : "+newVersion);
		console.log("New Data : "+sessions[editorId]["life"][newVersion]["content"]);
	}else{
		//	Version is from future. Invalid version. Reject the changes.
		console.log("Version is from future. Invalid version. Reject the changes.");
	}
	return newVersion;
	/*
	sessions[editorId].content=req.body.text;
	sessions[editorId].startTime=new Date();
	//console.log(sessions[editorId]);

	setTimeout(function(){
		while(sessions[editorId].connections.length){
			(function(connection){
				//console.log("Inside respond");
				connection.writeHead(200, { "Content-Type": "text/plain" });
				connection.end(sessions[editorId].content);
			})(sessions[editorId].connections.shift());
		}
	},0);
	*/
};











app.post('/wait',function(req,res){
	//console.log("Wait request from : "+req.body.editorId);
	var editorId=req.body.editorId;
	var version=req.body.version;
	/*
	res.writeHead(503, { "Content-Type": "text/plain" });
	res.end("Service Unavailable!");
	return;
	*/



	if(!sessions[editorId]){
		res.writeHead(404, { "Content-Type": "text/plain" });
		res.end("Session doesn't exists!");
		return;
	}

	if(!sessions[editorId].connections)sessions[editorId].connections=[];
	res.setHeader("Content-Type", "text/html");
	sessions[editorId].connections.push(res);
	sessions[editorId].startTime=new Date();
	}
);

/*
setInterval(function(){
	for(editorId in sessions){
		if(((new Date()).getTime())-(sessions[editorId].startTime.getTime())>1000*60*1){
			delete sessions[editorId];
		}
	}
},1000*60*1);
*/

var port = process.env.PORT || 5000;

app.listen(port, function() {
	console.log("Listening on " + port);
});


//app.listen(8124);
console.log('Starting application');
console.log('Server running at http://127.0.0.1:'+port);
