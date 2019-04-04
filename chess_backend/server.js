// var app = require("express")();
// // var http = require("http").Server(app);
// // var io = require("socket.io")(http);
// var server = app.listen(8810)
// var io = require('socket.io').listen(server);
//Ok I'm here. Yeah I got that. 'require' imports file.
// I don't have any knowledge of express as well.
// lol ok
var express = require('express');// this is just like importing something in react 
var app = express(); //initializing express
var server = app.listen(8082); //We are creating a server that socket.io will listen to 
var io = require('socket.io').listen(server); //Importing and listening
app.use((req, res, next) =>{ //This is just some cross-browser BS 
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/', (req, res) => {
    res.send('Working well!'); //This is what it returns when we visit the root route. We could have hosted our react app here if we wanted. Just try visiting https://ide50-gotzil8.cs50.io
    //Where does it send this 'Working Well'?
    //Oh ok. Cool. got it.
});
io.on('connection', socket => { //When a socket connects the first time...
    console.log(`user ${socket.id} connected!!!`);
    // What's the socket.id? It is a unique id that socket.io generates by default. Awesome.
    socket.on('on move made', data => { //"on move made" is called and event here. It is what we emitted from our react app when a player make a move. The data it emits is the units, turn, and a variable I called isTurn to stop a player from using the other color to play  in the state
    
        socket.broadcast.emit('on move made', data); //What does the first argument 'on move made' signify? it is an event, it is what socket uses to identify what the client emits to the server and vice versa. Ok got it. Do you understand what this does? Socket.broadcast.emit? I'm guessing it sends the data to all the clients connected to the server. Yeah. Exactly
    });
    socket.on('new game', () => {
        socket.broadcast.emit('new game');
    })
    // Yeah. Handle the emission
    // Ohh ok. I get it now
    //Let's try
    
})
app.listen(8080, () =>{ //this? this is the port our server is running on. The node.js server. What happens if we open this port? It opens it by default. It's just like opening the url without specifying any port. Oh ok.
  console.log('Server is live on port 8080');
 }) //Should we check the client now? Ok Yes! Which file is that? Main.js. Oh ok