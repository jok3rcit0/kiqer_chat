var express = require('express')
	, app = express()
	, http = require('http')
	, server = http.createServer(app)
	, io = require('socket.io').listen(server);

server.listen(31677);

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});

var usernames = {};

//Aka usar 'push' pa crear las salas de chat necesarias
var rooms = ['General','Partido México','Partido Neza'];

io.sockets.on('connection', function (socket) {
	
	socket.on('adduser', function(username){

		socket.username = username;
		socket.room = 'General';
		usernames[username] = username;
		socket.join('General');

		socket.emit('updatechat', 'Log:', 'estas en la sala 1');

		socket.broadcast.to('General').emit('updatechat', 'Log:', username + ' se ha unido a esta sala');
		socket.emit('updaterooms', rooms, 'General');
	});
	
	socket.on('sendchat', function (data) {
		io.sockets.in(socket.room).emit('updatechat', socket.username, data);
	});
	
	socket.on('switchRoom', function(newroom){
		socket.leave(socket.room);
		socket.join(newroom);
		socket.emit('updatechat', 'Log:', socket.username + ' has cambiado a la sala '+ newroom);
		//enviar mensaje de abandonoD: 
		socket.broadcast.to(socket.room).emit('updatechat', 'Log:', socket.username+' abandono esta sala');

		socket.room = newroom;
		socket.broadcast.to(newroom).emit('updatechat', 'Log:', socket.username+' se ha unido a esta sala');
		socket.emit('updaterooms', rooms, newroom);
	});

	socket.on('disconnect', function(){
		delete usernames[socket.username];
		io.sockets.emit('updateusers', usernames);
		socket.broadcast.emit('updatechat', 'Log:', socket.username + ' se ha desconectado');
		socket.leave(socket.room);
	});
});
