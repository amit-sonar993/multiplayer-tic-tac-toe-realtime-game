document.addEventListener("DOMContentLoaded", () => {
  const socket = io();
  const gameContainer = document.getElementById("game");
  const joinButton = document.getElementById("join");
  const restartButton = document.getElementById("restart");
  const roomDisplay = document.getElementById("room-display").querySelector("span");
  const turnDisplay = document.getElementById("turn-display").querySelector("span");
  const scoreDisplay = document.getElementById("score-display").querySelector("span"); // Score display

  let currentPlayer = "X";
  let roomId = "room-1";
  let currentTurn = null;
  let gameActive = true;

  joinButton.addEventListener("click", () => {
    socket.emit("join_room", roomId);
  });

  restartButton.addEventListener("click", () => {
    socket.emit("restart_game", roomId);
  });

  socket.on("room_joined", ({ room: roomName, playerSymbol }) => {
    roomId = roomName
    joinButton.style.display = "none";
    currentPlayer = playerSymbol;
    roomDisplay.textContent = `${roomName} as ${playerSymbol}`;
  });

  socket.on("game_update", (board) => {
    gameContainer.innerHTML = "";
    board.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        const cellDiv = document.createElement("div");
        cellDiv.className = "cell";
        cellDiv.textContent = cell;
        cellDiv.addEventListener("click", () => {
          console.log("cell is clicked");
          console.log("current Player", currentPlayer);
          console.log("currentTurn", currentTurn);

          console.log("gameActive", gameActive);
          console.log('roomId', roomId);
          

          if (
            gameActive &&
            cell === "" &&
            (currentTurn === null || currentPlayer === currentTurn)
          ) {
            console.log("player action is emmited to backend");

            socket.emit("player_action", {
              roomId,
              position: [rowIndex, colIndex],
            });
          }
        });
        gameContainer.appendChild(cellDiv);
      });
    });
  });

  socket.on("turn_update", (nextTurn) => {
    currentTurn = nextTurn;
    turnDisplay.textContent = nextTurn ? ` ${nextTurn}'s` : '';
  });

  socket.on("game_over", ({ result, winner }) => {
    gameActive = false;
    if (result === "draw") {
      turnDisplay.textContent = "It's a draw!";
    } else {
      turnDisplay.textContent = `${winner} wins!`;
    }
    restartButton.style.display = "block"; // Show the restart button
  });

  socket.on("game_restart", () => {
    gameActive = true;
  });

  // Update the score display
  socket.on("score_update", (scores) => {
    scoreDisplay.textContent = `X: ${scores.X}, O: ${scores.O}`;
  });
});
