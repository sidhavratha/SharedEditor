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
if(!sessions[editorId])sessions[editorId]={content:'',startTime:new Date()};
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
    content : sessions[editorId].content
});

}
});




app.post('/post',function(req,res){
//console.log(req.body.text);
var editorId = req.body.editorId;
if(!sessions[editorId]){
//sessions[editorId]={};
res.writeHead(404, { "Content-Type": "text/plain" });
res.end("Session doesn't exists!");
return;
}
sessions[editorId].content=req.body.text;
sessions[editorId].startTime=new Date();
//console.log(sessions[editorId]);

setTimeout(function(){
while(sessions[editorId].connections.length){
(function(connection){
//console.log("Inside respond");
connection.writeHead(200, { "Content-Type": "text/plain" });
connection.end(sessions[editorId].content);
}
)(sessions[editorId].connections.shift());
}},0);

res.setHeader("Content-Type", "text/html");
res.end('OK');
});


app.post('/wait',function(req,res){
//console.log("Wait request from : "+req.body.editorId);
var editorId=req.body.editorId;
if(!sessions[editorId]){
res.writeHead(404, { "Content-Type": "text/plain" });
res.end("Session doesn't exists!");
return;
}

if(!sessions[editorId].connections)sessions[editorId].connections=[];
res.setHeader("Content-Type", "text/html");
sessions[editorId].connections.push(res);
sessions[editorId].startTime=new Date();
});

setInterval(function(){
for(editorId in sessions){
if(((new Date()).getTime())-(sessions[editorId].startTime.getTime())>1000*60*1){
delete sessions[editorId];
}
}
},1000*60*1);

app.listen(8124);

console.log('Server running at http://127.0.0.1:8124/');
