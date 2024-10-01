// src/controllers/gameController.ts

import { Server, Socket } from 'socket.io';
import { checkWinner, isMoveValid } from '../utils/gameLogic';
import { addUserToRoom, getRoom, initializeRoom, getAllRooms, removeUserFromRoom, findRoomWithLessThanTwoPlayers, resetRoom } from '../models/roomModel';




const handlePlayerAction = (room: string, position: [number, number], socket: any, io: Server) => {
    const rooms = getAllRooms()
    const [row, col] = position;
    const currentPlayerSymbol = rooms[room].players[socket.id]?.playerSymbol;
    const currentTurn = rooms[room].turnTracker;

    if (isMoveValid(rooms[room].board, row, col, currentPlayerSymbol, currentTurn)) {
        // Mark the board with the current player's symbol
        rooms[room].board[row][col] = currentPlayerSymbol;
        rooms[room].markedCellsCount++;

        // Check for a winner or draw only if at least 3 cells are marked
        let result = null;
        if (rooms[room].markedCellsCount >= 3) {
            result = checkWinner(rooms[room].board);
        }

        // Switch turn
        rooms[room].turnTracker = currentPlayerSymbol === 'X' ? 'O' : 'X';

        // Emit the updated game state to the players
        io.to(room).emit('game_update', rooms[room].board);
        io.to(room).emit('turn_update', rooms[room].turnTracker); // Notify players whose turn it is

        // Notify players if the game is over
        if (result) {
            if (result === 'draw') {
                io.to(room).emit('game_over', { result, winner: null });
            } else {
                rooms[room].scores[result]++;
                io.to(room).emit('game_over', { result, winner: result });
                io.to(room).emit('score_update', rooms[room].scores); // Emit updated scores
            }
        }
    }
};

const handleRoomJoin = (playerRoomId: string, socket: Socket, io: Server) => {
    var roomId = playerRoomId
    const rooms = getAllRooms()
    const room = getRoom(roomId)
    var playerSymbol = '';

    console.log('room =>', room);
    if (Object.keys(room!.players).length >= 2) {
        // create a new room
        const roomWithLessThanTwoPlayers = findRoomWithLessThanTwoPlayers()

        if (roomWithLessThanTwoPlayers) {
            roomId = roomWithLessThanTwoPlayers.id
            console.log('roomWithLessThanTwoPlayers', roomWithLessThanTwoPlayers);
            const existingRoomPlayers = roomWithLessThanTwoPlayers.players

            playerSymbol = Object.keys(existingRoomPlayers).length == 0 ? 'X' : existingRoomPlayers[Object.keys(existingRoomPlayers)[0]].playerSymbol == 'X' ? 'O' : 'X';
        } else {
            let newRoomId = `room-${Object.keys(rooms).length + 1}`

            roomId = initializeRoom(newRoomId).id
            playerSymbol = 'X'
        }
    } else {
        playerSymbol = Object.keys(room!.players).length === 0 ? 'X' : room!.players[Object.keys(room!.players)[0]].playerSymbol == 'X' ? 'O' : 'X';
    }

    console.log('roomId before joining', roomId);

    addUserToRoom(roomId, socket.id, playerSymbol);
    socket.join(roomId);

    console.log('room after joining=>', rooms[roomId]);
    console.log(`Player ${socket.id} joined room: ${roomId} as ${playerSymbol}`);
    socket.emit('room_joined', { room: roomId, playerSymbol });
    io.to(roomId).emit('game_update', getRoom(roomId)!.board);
}

const handleGameRestart = (roomId: string, io: Server) => {
    const room = getRoom(roomId);
    if (room) {
        resetRoom(roomId);
        io.to(roomId).emit('game_update', room.board);
        io.to(roomId).emit('turn_update', null); // Reset turn display
        io.to(roomId).emit('game_restart'); // Reset turn display
    } else {
        console.error(`Room ${roomId} not found for restart.`);
    }
}

const handleChatMsgSend = (chatMsg: string, roomId: string, io: Server) => {

}

const handleRoomDisconnect = (socket: Socket, io: Server) => {
    const rooms = getAllRooms()
    console.log('ROOMS => ', rooms);

    for (const roomId of Object.keys(rooms || {})) { // Use optional chaining here
        removeUserFromRoom(roomId, socket.id);
        io.to(roomId).emit('player_left', { message: `Player ${socket.id} has left the game.` });
    }

    console.log('ROOMS after user disconnects', rooms);

}

export { initializeRoom, handlePlayerAction, handleRoomJoin, handleRoomDisconnect, handleGameRestart, handleChatMsgSend };
