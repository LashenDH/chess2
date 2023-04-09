var express = require('express');
var app = express();
app.use(express.static('public')); 
var http = require('http').Server(app);
var port = process.env.PORT || 3000;

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/public/default.html');
});

http.listen(port, function() {
    console.log('listening on *: ' + port);
});

var io = require('socket.io')(http);

players = {};

class Player{
    constructor(socket, room, name){
        if(socket in players){ players[socket].push({'name' : name, 'room' : room}); }
        else{ players[socket] = [{'name' : name, 'room' : room}]; }

        this.room = room;
        this.name = name;
    }

    room(){
        return this.room;
    }

    name(){
        return this.name;
    }
}

function getPlayerList(room){
    var playerList = {};
    if(players[room]){
        players[room].forEach(function(player){
            playerList[player.socket] = player;
        });
    }
    return playerList;
}

io.on('connection', function(socket) {
    socket.on('move', function(msg) {
        socket.to(msg[1]).emit('move', msg[0]); 
    });
    var currentPlayer;
    var keys = 1;

    numberOfTimesRoom = 0;
    
    socket.on('CREATE_PLAYER', function(data){
        var room = data[0];
        var name = data[1];
        var team;
    
        if(!players[room]){
            // First player in the room
            team = "white";
        }
        else{
            // Second player in the room
            var existingPlayer = players[room][0];
            if(existingPlayer.team == "white"){
                team = "black";
            }
            else{
                team = "white";
            }
        }
    
        var player = {
            name: name,
            room: room,
            team: team,
            socket: socket.id
        };
    
        if(!players[room]){
            players[room] = [];
        }
    
        if (players[room].length >= 2) {
            socket.emit('roomFull');
            return;
        }
    
        players[room].push(player);
        socket.join(room);
        io.to(room).emit('playerList', getPlayerList(room));
    });

    socket.on('RETURN_PLAYER_LIST', function(room) {
        socket.emit('playerList', getPlayerList(room));
    });
    
    socket.on('disconnect', function() {
        console.log('user disconnected');
        for(var room in players){
            if(players[room]){
                players[room] = players[room].filter(function(item) {
                    return item.socket !== socket.id;
                });
                
                io.to(room).emit('playerList', getPlayerList(room));
            }
        }
    });
});
