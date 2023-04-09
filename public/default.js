var board;
var game;
var room;
var team;

document.getElementById("game").style.display = "none";

var socket = io();

var handleMove = function(source, target, piece) {
    var move = game.move({from: source, to: target});
    if(piece.search(/^w/) !== -1 && team == "white"){
        if (move === null)  return 'snapback';
        else socket.emit('move', [move, room]);
    }
    else if(piece.search(/^b/) !== -1  && team == "black"){
        if (move === null)  return 'snapback';
        else socket.emit('move', [move, room]);
    }
    else{
        console.log(team);
        console.log(piece.search(/^b/))
        console.log(piece.search(/^w/))
        return 'snapback';
    }
};

socket.on('move', function (msg) {
    game.move(msg);
    board.position(game.fen());
});

var fullRoom = 0;
document.getElementById("alert-wrapper").style.opacity = 0;

function joinRoom(){
    socket.emit('CREATE_PLAYER', [document.getElementById("room").value, document.getElementById("name").value ]);
    room = document.getElementById("room").value;
    team = document.getElementById("name").value;
    document.getElementById("lobby").style.display = "none";
    document.getElementById("gameProgress").style.display = "block";
    document.getElementById("loading").style.display = "block";
    socket.emit('RETURN_PLAYER_LIST', document.getElementById("room").value);
}

socket.on('playerList', function(players){
    var keys = Object.keys(players);
    var playerName = "";

    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];

        if(i == 0 && keys.length > 1){
            playerName += players[key].name + " VS ";

        }
        else{
            playerName += players[key].name;
        }

        if(players[key].name == team){
            team = players[key].team;
        }
    }
    
    document.getElementById("playerList").innerHTML = playerName;
    if(fullRoom == 0){
        if(Object.keys(players).length < 2){
            document.getElementById("gameProgress").textContent = "WAITING FOR MORE PLAYERS";
            document.getElementById("loading").classList.add("load");
        }
        else{
            document.getElementById("gameProgress").textContent = "STARTING";
            document.getElementById("loading").classList.remove("load");
            setTimeout(() => {
                document.getElementById("loading").style.display = "none";
                document.getElementById("game").style.display = "block";
                document.getElementById("gameBoard").style.display = "block";
                var cfg = {
                    draggable: true,
                    position: 'start',
                    onDrop: handleMove,
                };
                
                board = new ChessBoard('gameBoard', cfg);
                game = new Chess();
                if(team == "black"){
                    board.flip();
                    document.getElementById("team").textContent = "Your Team Is Black";
                }
            }, 5000);
        }
    }
});

socket.on('roomFull', function(){
    document.getElementById("playerList").innerHTML = "";
    document.getElementById("lobby").style.display = "block";
    document.getElementById("gameProgress").style.display = "none";
    document.getElementById("loading").style.display = "none";
    document.getElementById("alert-wrapper").style.opacity = 1;
    document.getElementById("alert-wrapper").classList.add("fade");
    document.getElementById("alert-wrapper").addEventListener("animationend", function(){
        document.getElementById("alert-wrapper").classList.remove("fade");
        document.getElementById("alert-wrapper").style.opacity = 0;
    });
    fullRoom = 1;
})