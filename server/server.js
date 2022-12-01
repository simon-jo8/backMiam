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
        socket.broadcast.emit('changeFinish', finish, room)

        finishPoint = finish;
    })

    socket.on('join', room => {
        allUsers.forEach(user => {
            if (user.id === socket.id) {
                allUsers.splice(allUsers.indexOf(user), 1)
                roomUsers.push(user)
            }
        })
        socket.broadcast.emit('allUsers', allUsers, test);
        io.emit('userRoom', roomUsers, room);
    })
    socket.on('leaveRoom', (room, user) => {
        socket.leave(room)
        roomUsers.forEach(user => {
            if (user.id === socket.id) {
                roomUsers.splice(allUsers.indexOf(user), 1)
            }
        })
        allUsers.push(user);
        io.emit('allUsers', allUsers, test);
        socket.broadcast.emit('userRoom', roomUsers, room);
    });



    socket.on("send-message", (message, room) => {
        if (room === '') {
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
