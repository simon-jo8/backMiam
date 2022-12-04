const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);

const socketIo = require("socket.io");
let test = 1;
const io = socketIo(server, {
    cors: {
        origin: '*',
    }
})

let allUsers = [];
let finishPoint;
let roomUsers = [];

app.get('/', (req, res) => {
    console.log('server default res');
    res.send('<h1>oklm</h1>');
});


server.listen(3000, () => {
    console.log('run in 3000');
});


io.on('connection', (socket) => {
    socket.on('newUser', user => {
        allUsers.push(user[0])
        io.emit('allUsers', allUsers, test)
        if (allUsers.length > 1 && finishPoint) {
            io.emit('changeFinish', finishPoint)
        }
    })
    socket.on('nameChange', updatedUser => {
        socket.broadcast.emit('nameChange', updatedUser)
        allUsers.forEach(user => {
            if (user.id === updatedUser.id) {
                user.name = updatedUser.name
            }
        })
    })


    socket.on('roomChangeInfo', updatedUser => {
        socket.broadcast.emit('roomChangeInfo', updatedUser)
        allUsers.forEach(user => {
            if (user.id === updatedUser.id) {
                user.room = updatedUser.room
            }
        })
    })

    socket.on('restauChange', updatedUser => {
        socket.broadcast.emit('restauChange', updatedUser)
        allUsers.forEach(user => {
            if (user.id === updatedUser.id) {
                user.restaurant = updatedUser.restaurant
            }
        })
    })
    socket.on('changeFinish', (finish, room) => {
        if (room !== ""){
            io.to(room).emit('changeFinishRoom',finish,room)
        }else{
            finishPoint = finish;
            socket.broadcast.emit('changeFinish', finish, room)
        }
    })

    socket.on('join', (room,user) => {
        socket.join(room);
        allUsers.forEach(user => {
            if (user.id === socket.id) {
                allUsers.splice(allUsers.indexOf(user), 1)
            }
        })
        let addRoom =
            {
                "id":room,
                "users":[user],
            }
        if (roomUsers.length>0){
            roomUsers.forEach(Room =>{
                if(Room.id === room){
                    Room.users.push(user)
                    io.in(room).emit('userRoom', Room.users, room)
                    socket.broadcast.emit('allUsers', allUsers, test);

                }else{
                    roomUsers.push(addRoom)
                    io.in(room).emit('userRoom', addRoom.users, room)
                    socket.broadcast.emit('allUsers', allUsers, test);

                }
            })
        }else{
            roomUsers.push(addRoom)
            io.in(room).emit('userRoom', addRoom.users, room)
            socket.broadcast.emit('allUsers', allUsers, test);
        }
    })



    socket.on('leaveRoom', (room, newUser) => {
        socket.leave(room)
        roomUsers.forEach(Room =>{
            if(Room.id === room){
                Room.users.forEach(User =>{
                    if (User.id === newUser.id){
                        Room.users.splice(Room.users.indexOf(User),1)
                    }
                })
                io.in(room).emit('userRoom', Room.users, room)
            }
            if(Room.users == null){
                roomUsers.splice(roomUsers.indexOf(Room),1)
            }
        })
        allUsers.push(newUser);
        if (room !== ""){
            console.log('done')
            socket.broadcast.emit('changeFinish', finishPoint, room)
        }else{
        }
        io.emit('allUsers', allUsers, test);
    });


    socket.on("send-message", (message, room) => {
        console.log(message,room)
        if (room === "") {
            console.log('non')
            socket.broadcast.emit('receive-message', message)
        } else {
            socket.broadcast.emit('receive-message-room', message, room)
        }
    })

    socket.on('disconnect', () => {
        allUsers.forEach(user => {
            if (user.id === socket.id) {
                allUsers.splice(allUsers.indexOf(user), 1)
            }
        })
        io.emit('allUsers', allUsers, test)
        io.emit('removeName', socket.id)
    });
});

