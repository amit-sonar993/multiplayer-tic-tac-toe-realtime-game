// src/server.ts
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = 3000;

const rooms: Record<string, {
    board: string[][];
    markedCellsCount: number;
    joinedUsers: { [socketId: string]: { playerSymbol: string } };
    scores: { [key: string]: number }; // Allow any string as a key
    turnTracker: string | null; // Track whose turn it is for each room
}> = {};

const checkWinner = (board: string[][]): string | null => {
    const winningCombinations = [
        // Rows
        [[0, 0], [0, 1], [0, 2]],
        [[1, 0], [1, 1], [1, 2]],
        [[2, 0], [2, 1], [2, 2]],
        // Columns
        [[0, 0], [1, 0], [2, 0]],
        [[0, 1], [1, 1], [2, 1]],
        [[0, 2], [1, 2], [2, 2]],
        // Diagonals
        [[0, 0], [1, 1], [2, 2]],
        [[0, 2], [1, 1], [2, 0]],
    ];

    for (const combination of winningCombinations) {
        const [a, b, c] = combination;
        if (board[a[0]][a[1]] && board[a[0]][a[1]] === board[b[0]][b[1]] && board[a[0]][a[1]] === board[c[0]][c[1]]) {
            return board[a[0]][a[1]]; // Return 'X' or 'O'
        }
    }

    // Check for a draw
    if (board.flat().every(cell => cell !== '')) {
        return 'draw';
    }

    return null; // No winner or draw
};

const handlePlayerAction = (room: string, position: [number, number], socket: any) => {
    try {
        const [row, col] = position;
        const currentPlayerSymbol = rooms[room].joinedUsers[socket.id]?.playerSymbol;
        const currentTurn = rooms[room].turnTracker
    
        console.log('turn tracker before validation check ', currentTurn);
    
    
    
        if (isMoveValid(room, row, col, currentPlayerSymbol, currentTurn)) {
            // Mark the board with the current player's symbol
            rooms[room].board[row][col] = currentPlayerSymbol == null ? '' : currentPlayerSymbol;
            rooms[room].markedCellsCount++; // Increment marked cells count
    
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
    } catch (error) {
        console.log('error', error);
        
    }
};

const isMoveValid = (room: string, row: number, col: number, currentPlayerSymbol: string | null, currentTurn: string | null): boolean => {
    // Check if currentSymbol is not null and the move is valid
    console.log('currentPlayerSymbol', currentPlayerSymbol);
    console.log('room =>', room);
    console.log('currentTurn', currentTurn);



    const isMoveValid = currentPlayerSymbol !== null &&
        rooms[room].board[row][col] === '' &&
        (currentTurn === null || currentTurn === currentPlayerSymbol);

    console.log('isMoveValid', isMoveValid);



    return isMoveValid
};


app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('A player connected:', socket.id);

    socket.on('join_room', (room) => {
        if (!rooms[room]) {
            rooms[room] = {
                board: [['', '', ''], ['', '', ''], ['', '', '']],
                markedCellsCount: 0,
                joinedUsers: {},
                scores: { X: 0, O: 0 }, // Initialize scores for the room
                turnTracker: null, // Initialize turn tracker for the room
            };
        }

        // Determine player symbol
        let playerSymbol = 'X'; // Default player symbol
        if (Object.keys(rooms[room].joinedUsers).length >= 2) {
            // Create a new room if there are already 2 players
            const newRoom = `room${Object.keys(rooms).length + 1}`;
            rooms[newRoom] = {
                board: [['', '', ''], ['', '', ''], ['', '', '']],
                markedCellsCount: 0,
                joinedUsers: {},
                scores: { X: 0, O: 0 }, // Initialize scores for the new room
                turnTracker: null, // Initialize turn tracker for the new room
            };
            room = newRoom; // Update to the new room
            playerSymbol = 'X'; // Assign new player symbol in new room
        } else if (Object.keys(rooms[room].joinedUsers).length === 1) {
            playerSymbol = 'O'; // Second player gets O
        }

        // Add the user to the room's joined users
        rooms[room].joinedUsers[socket.id] = { playerSymbol }; // Store symbol with socket ID

        console.log('rooms[room].joinedUsers', rooms[room].joinedUsers);
        

        socket.join(room); // Join the player to the room

        console.log(`Player ${socket.id} joined room: ${room} as ${playerSymbol}`);

        // Notify the client about the room and player symbol they've joined
        socket.emit('room_joined', { room, playerSymbol });
        io.to(room).emit('game_update', rooms[room].board); // Send the initial game state
        io.to(room).emit('score_update', rooms[room].scores); // Send initial scores
        io.to(room).emit('turn_update', rooms[room].turnTracker); // Send initial turn state
    });

    socket.on('player_action', ({ room, position }) => {
        console.log(`Player ${socket.id} is trying to click at postion ${position} in room ${room}`);

        handlePlayerAction(room, position, socket);
    });

    // Handle restart game
    socket.on('restart_game', (room) => {
        if (rooms[room]) {
            rooms[room].board = [['', '', ''], ['', '', ''], ['', '', '']];
            rooms[room].markedCellsCount = 0;
            rooms[room].turnTracker = null; // Reset turn tracker
            io.to(room).emit('game_update', rooms[room].board); // Notify players of the reset
            io.to(room).emit('turn_update', rooms[room].turnTracker); // Reset turn display
            io.to(room).emit('game_restart') // Reset the Game board
        }
    });

    socket.on('disconnect', () => {
        console.log('Player disconnected:', socket.id);

        // Remove the user from joined users in all rooms they are part of
        for (const room in rooms) {
            if (rooms[room].joinedUsers[socket.id]) {
                // If the user is found in the room's joinedUsers, remove them
                delete rooms[room].joinedUsers[socket.id];

                // Update player count and notify remaining players if needed
                console.log(`Player ${socket.id} has left room: ${room}`);

                // Optionally notify remaining players about the disconnection
                io.to(room).emit('player_left', { message: `Player ${socket.id} has left the game.` });
            }
        }
    });

});

server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
