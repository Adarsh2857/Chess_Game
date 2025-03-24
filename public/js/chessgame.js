const socket = io();
const chess = new Chess();
const boardElement = document.querySelector(".chessboard");

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

const renderBoard = () => {
    const board = chess.board();
    boardElement.innerHTML = "";
    board.forEach((row, rowindex) => {
        row.forEach((square, squareindex) => {
            const squareElement = document.createElement("div");
            squareElement.classList.add(
                "square",
                (rowindex + squareindex) % 2 === 0 ? "Light" : "Dark"
            );
            squareElement.dataset.row = rowindex;
            squareElement.dataset.col = squareindex;

            if (square) {
                const pieceElement = document.createElement("div");
                pieceElement.classList.add(
                    "piece",
                    square.color === "w" ? "white" : "black"
                );
                pieceElement.innerHTML = getPieceUnicode(square.type, square.color);
                
                // Make it draggable if it's the player's turn
                pieceElement.draggable = chess.turn() === square.color;

                // Drag Start
                pieceElement.addEventListener("dragstart", (e) => {
                    if (pieceElement.draggable) {
                        draggedPiece = pieceElement;
                        sourceSquare = { row: rowindex, col: squareindex };
                        e.dataTransfer.setData("text/plain", "");
                    }
                });

                // Drag End
                pieceElement.addEventListener("dragend", () => {
                    draggedPiece = null;
                    sourceSquare = null;
                });

                squareElement.appendChild(pieceElement);
            }

            // Allow dragging over square
            squareElement.addEventListener("dragover", (e) => {
                e.preventDefault();
            });

            // Handle dropping piece
            squareElement.addEventListener("drop", (e) => {
                e.preventDefault();
                if (draggedPiece) {
                    const targetSquare = {
                        row: parseInt(squareElement.dataset.row),
                        col: parseInt(squareElement.dataset.col),
                    };

                    handleMove(sourceSquare, targetSquare);
                }
            });

            boardElement.appendChild(squareElement);
        });
    });
};

const handleMove = (source, target) => {
    if (!source || !target) return;

    const move = {
        from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
        to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`
    };

    const result = chess.move(move);
    if (result) {
        socket.emit("move", move);
        renderBoard();
    }
};

const getPieceUnicode = (type, color) => {
    const pieces = {
        p: "♙", r: "♖", n: "♘", b: "♗", q: "♕", k: "♔"
    };

    if (color === "b") {
        return pieces[type].toLowerCase();
    }
    return pieces[type];
};

// === SOCKET EVENTS ===
// Assign player roles based on connection
socket.on("playerRole", function(role) {
    playerRole = role;
    renderBoard();
});

// Update board when receiving a move from another player
socket.on("move", function(move) {
    chess.move(move);
    renderBoard();
});

// Load initial board state
socket.on("boardState", function(fen) {
    chess.load(fen);
    renderBoard();
});

renderBoard();
