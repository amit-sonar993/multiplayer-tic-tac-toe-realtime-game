// src/models/roomModel.ts

interface Room {
    id: string
    board: string[][];              // Represents the Tic Tac Toe board
    markedCellsCount: number;       // Number of cells marked
    players: Record<string, { playerSymbol: string }>; // Users in the room
    scores: { [key: string]: number }; // Scores for each player
    turnTracker: string | null;      // Tracks whose turn it is
}

const rooms: Record<string, Room> = {};

const initializeRoom = (roomId: string) => {
    return rooms[roomId] = {
        id: roomId,
        board: [['', '', ''], ['', '', ''], ['', '', '']],
        markedCellsCount: 0,
        players: {},
        scores: { X: 0, O: 0 },
        turnTracker: null,
    };
};

const getRoom = (roomId: string): Room | undefined => {
    return rooms[roomId] ? rooms[roomId] : initializeRoom(roomId);
};

const getAllRooms = () => {
    return rooms
}

const updateRoomBoard = (roomId: string, board: string[][]) => {
    if (rooms[roomId]) {
        rooms[roomId].board = board;
    }
};

const addUserToRoom = (roomId: string, socketId: string, playerSymbol: string) => {
    if (rooms[roomId]) {
        rooms[roomId].players[socketId] = { playerSymbol };
    }
};

const removeUserFromRoom = (roomId: string, socketId: string) => {
    if (rooms[roomId]) {
        delete rooms[roomId].players[socketId];
    }
};

const resetRoom = (roomId: string) => {
    if (rooms[roomId]) {
        rooms[roomId].board = [['', '', ''], ['', '', ''], ['', '', '']];
        rooms[roomId].markedCellsCount = 0;
        rooms[roomId].turnTracker = null;
    }
};

// Function to find one room with less than 2 players
const findRoomWithLessThanTwoPlayers = (): Room | null => {
    for (const roomId in rooms) {
        const playerCount = Object.keys(rooms[roomId].players).length;
        if (playerCount < 2) {
            return rooms[roomId];  // Return the room object found with less than 2 players
        }
    }
    return null; // No room found
};


export {
    Room,
    initializeRoom,
    getRoom,
    updateRoomBoard,
    addUserToRoom,
    removeUserFromRoom,
    resetRoom,
    getAllRooms,
    findRoomWithLessThanTwoPlayers
};
