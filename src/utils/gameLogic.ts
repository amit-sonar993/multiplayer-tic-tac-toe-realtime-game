// src/utils/gameLogic.ts

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

// Function to check for a winner
const checkWinner = (board: string[][]): string | null => {
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

// Function to validate a player's move
const isMoveValid = (board: string[][], row: number, col: number, currentPlayerSymbol: string | null, currentTurn: string | null): boolean => {
    return (
        currentPlayerSymbol !== null &&
        board[row][col] === '' &&
        (currentTurn === null || currentTurn === currentPlayerSymbol)
    );
};

export { checkWinner, isMoveValid };
