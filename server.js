const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let isButtonActive = false;
let groupScores = {};
let numberOfGroups = 0;

app.use(express.static('views'));

let presenters = [];
const MAX_PRESENTERS = 3;

io.on('connection', (socket) => {
    console.log('A user connected');

    if (numberOfGroups > 0) {
        socket.emit('number of groups updated', numberOfGroups);
        socket.emit('scores initialized', groupScores);
    }

    socket.on('activate button', () => {
        isButtonActive = true;
        presenters = [];
        io.emit('button activated');
    });

    socket.on('request to present', ({ name, group }) => {
        if (isButtonActive && presenters.length < MAX_PRESENTERS) {
            presenters.push({ name, group });
            io.emit('presenter confirmed', { name, group });
            io.emit('update presenter list', presenters);  // 발표자 목록 업데이트
            if (presenters.length === MAX_PRESENTERS) {
                io.emit('disable button');
                isButtonActive = false;
            }
        }
    });

    socket.on('score update', ({ group, score }) => {
        if (groupScores[group] === undefined) {
            groupScores[group] = 0;
        }
        groupScores[group] += score;
        io.emit('score updated', { group, score: groupScores[group] });
    });

    socket.on('set number of groups', (num) => {
        if (numberOfGroups === 0) {
            numberOfGroups = num;
            groupScores = {};
            for (let i = 1; i <= numberOfGroups; i++) {
                groupScores[i] = 0;
            }
            io.emit('number of groups updated', numberOfGroups);
            io.emit('scores initialized', groupScores);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

const port = process.env.PORT || 8080;
server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});