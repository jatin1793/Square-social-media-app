const io = require( "socket.io" )();
const socketapi = {
    io: io
};

var onlineusernames = [];
var onlineuserids = [];

io.on( "connection", function( socket ) {

    socket.on("nameset",function(data){
        onlineuserids.push(socket.id);
        onlineusernames.push(data);
    io.emit("online",onlineusernames);

    })

        console.log( "A user connected" );
    socket.on("msg",function(data){
        io.emit("msg",data)
    })

    socket.on("typing",function(){
        socket.broadcast.emit("typing");
    })
    
    socket.on("disconnect",function(){
        onlineusernames.splice(onlineuserids.indexOf(socket.id),1);
        onlineuserids.splice(onlineuserids.indexOf(socket.id),1);
        io.emit("online",onlineusernames);
    })
});


module.exports = socketapi;