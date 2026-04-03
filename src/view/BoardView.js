class BoardView {
    constructor(boardSize = 8) {
        this.boardSize = boardSize;
        this.boardContainer = document.getElementById('chessBoard');
        this.colLabelsContainer = document.getElementById('boardColLabels');
        this.rowLabelsContainer = document.getElementById('boardRowLabels');
        this.knightPiece = null;
    }

    initializeBoard() {
        if (!this.boardContainer) return;

        this.boardContainer.innerHTML = '';
        if (this.colLabelsContainer) this.colLabelsContainer.innerHTML = '';
        if (this.rowLabelsContainer) this.rowLabelsContainer.innerHTML = '';

        for (let index = 0; index < this.boardSize; index++) {
            if (this.colLabelsContainer) {
                const colLabel = document.createElement('span');
                colLabel.className = 'board-axis-value';
                colLabel.textContent = String(index);
                this.colLabelsContainer.appendChild(colLabel);
            }

            if (this.rowLabelsContainer) {
                const rowLabel = document.createElement('span');
                rowLabel.className = 'board-axis-value';
                rowLabel.textContent = String(index);
                this.rowLabelsContainer.appendChild(rowLabel);
            }
        }

        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                const square = document.createElement('div');
                square.className = 'chess-square';
                square.id = `square-${row}-${col}`;

                if ((row + col) % 2 === 0) {
                    square.classList.add('white');
                } else {
                    square.classList.add('black');
                }

                square.dataset.row = row;
                square.dataset.col = col;
                this.boardContainer.appendChild(square);
            }
        }

        this.ensureKnightPiece();
    }

    ensureKnightPiece() {
        if (!this.boardContainer) return;

        let piece = document.getElementById('knightPiece');
        if (!piece) {
            piece = document.createElement('div');
            piece.id = 'knightPiece';
            piece.className = 'knight-piece';
            piece.innerHTML = '<span class="knight-glyph" aria-hidden="true">&#9822;</span>';
            this.boardContainer.appendChild(piece);
        }

        piece.style.display = 'none';
        this.knightPiece = piece;
    }

    getSquare(row, col) {
        return document.getElementById(`square-${row}-${col}`);
    }

    moveKnightToSquare(square, immediate = false) {
        if (!this.knightPiece || !square || !this.boardContainer) return;

        const boardRect = this.boardContainer.getBoundingClientRect();
        const squareRect = square.getBoundingClientRect();

        const centerX = squareRect.left - boardRect.left + squareRect.width / 2;
        const centerY = squareRect.top - boardRect.top + squareRect.height / 2;

        this.knightPiece.style.transition = immediate ? 'none' : 'left 0.25s ease, top 0.25s ease';
        this.knightPiece.style.display = 'flex';
        this.knightPiece.style.left = `${centerX}px`;
        this.knightPiece.style.top = `${centerY}px`;
    }

    clearBoardState() {
        if (!this.boardContainer) return;

        this.boardContainer.querySelectorAll('.chess-square').forEach((square) => {
            square.classList.remove('visited', 'current');
            delete square.dataset.position;
        });
    }

    hideKnight() {
        if (this.knightPiece) {
            this.knightPiece.style.display = 'none';
        }
    }

    renderStep(solution, step, immediate = false) {
        this.clearBoardState();

        if (!solution || step < 0) {
            this.hideKnight();
            return 0;
        }

        for (let index = 0; index <= step; index++) {
            const position = solution[index];
            if (!position) continue;

            const square = this.getSquare(position.row, position.col);
            if (!square) continue;

            square.dataset.position = `${index + 1}`;
            if (index === step) {
                square.classList.add('current');
                this.moveKnightToSquare(square, immediate);
            } else {
                square.classList.add('visited');
            }
        }

        return step + 1;
    }
}

export default BoardView;
