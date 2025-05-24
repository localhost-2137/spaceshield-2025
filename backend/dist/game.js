"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Game = void 0;
class Game {
    constructor() {
        this.onNewStateListeners = [];
        this.state = {
            board: {},
            currentPlayer: 'X',
            oPoints: 0,
            xPoints: 0,
            winner: null,
            boardLayerCount: 1, // which means we have one layer surrounding the center, in other words, 3x3 board
        };
    }
    getState(playerFigure) {
        return Object.assign(Object.assign({}, this.state), { yourFigure: playerFigure });
    }
    onNewState(callback) {
        this.onNewStateListeners.push(callback);
    }
    isMoveValid(playerFigure, move) {
        var _a, _b;
        if (this.state.currentPlayer !== playerFigure) {
            console.error('Not your turn');
            return false;
        }
        if (move.length !== 2) {
            console.error('Move must have 2 elements');
            return false;
        }
        const [x, y] = move;
        if (Math.abs(x) > this.state.boardLayerCount || Math.abs(y) > this.state.boardLayerCount) {
            console.error('Move is out of bounds');
            return false;
        }
        if ((_b = (_a = this.state.board[x]) === null || _a === void 0 ? void 0 : _a[y]) === null || _b === void 0 ? void 0 : _b.isWinningField) {
            console.error('Move is disabled');
            return false;
        }
        return true;
    }
    lookForWinner(pointToLookAround) {
        var _a, _b, _c;
        const [x, y] = pointToLookAround;
        const figure = this.state.board[x][y].figure;
        // Check horizontal:
        let horizontalCount = 0;
        for (let i = x - 2; i <= x + 2; i++) {
            const fieldToCheck = (_a = this.state.board[i]) === null || _a === void 0 ? void 0 : _a[y];
            if ((fieldToCheck === null || fieldToCheck === void 0 ? void 0 : fieldToCheck.isWinningField) || (fieldToCheck === null || fieldToCheck === void 0 ? void 0 : fieldToCheck.figure) !== figure) {
                horizontalCount = 0;
                continue;
            }
            horizontalCount++;
            if (horizontalCount >= 3) {
                if (figure === 'X') {
                    this.state.xPoints++;
                }
                else {
                    this.state.oPoints++;
                }
                // Mark winning fields:
                for (let j = i - 2; j <= i; j++) {
                    this.state.board[j][y].isWinningField = true;
                }
            }
        }
        // Check vertical:
        let verticalCount = 0;
        for (let i = y - 2; i <= y + 2; i++) {
            const fieldToCheck = (_b = this.state.board[x]) === null || _b === void 0 ? void 0 : _b[i];
            if ((fieldToCheck === null || fieldToCheck === void 0 ? void 0 : fieldToCheck.isWinningField) || (fieldToCheck === null || fieldToCheck === void 0 ? void 0 : fieldToCheck.figure) !== figure) {
                verticalCount = 0;
                continue;
            }
            verticalCount++;
            if (verticalCount >= 3) {
                if (figure === 'X') {
                    this.state.xPoints++;
                }
                else {
                    this.state.oPoints++;
                }
                // Mark winning fields:
                for (let j = i - 2; j <= i; j++) {
                    this.state.board[x][j].isWinningField = true;
                }
            }
        }
        let diagonalCount = 0;
        for (let i = -2; i <= 2; i++) {
            const fieldToCheck = (_c = this.state.board[x + i]) === null || _c === void 0 ? void 0 : _c[y + i];
            if ((fieldToCheck === null || fieldToCheck === void 0 ? void 0 : fieldToCheck.isWinningField) || (fieldToCheck === null || fieldToCheck === void 0 ? void 0 : fieldToCheck.figure) !== figure) {
                diagonalCount = 0;
                continue;
            }
            diagonalCount++;
            if (diagonalCount >= 3) {
                if (figure === 'X') {
                    this.state.xPoints++;
                }
                else {
                    this.state.oPoints++;
                }
                // Mark winning fields:
                for (let j = i - 2; j <= i; j++) {
                    this.state.board[x + j][y + j].isWinningField = true;
                }
            }
        }
    }
    areAnyMovesLeft() {
        var _a;
        for (let i = -this.state.boardLayerCount; i <= this.state.boardLayerCount; i++) {
            for (let j = -this.state.boardLayerCount; j <= this.state.boardLayerCount; j++) {
                if (!((_a = this.state.board[i]) === null || _a === void 0 ? void 0 : _a[j])) {
                    return true;
                }
            }
        }
        return false;
    }
    resetNotWinningFields() {
        for (const row in this.state.board) {
            for (const col in this.state.board[row]) {
                const isWinningField = this.state.board[row][col].isWinningField;
                if (!isWinningField)
                    delete this.state.board[row][col];
            }
        }
        // Now delete remaining empty rows:
        for (const row in this.state.board) {
            if (Object.keys(this.state.board[row]).length === 0) {
                delete this.state.board[row];
            }
        }
    }
    makeMove(playerFigure, move) {
        if (this.state.winner)
            return;
        if (!this.isMoveValid(playerFigure, move))
            return;
        const [x, y] = move;
        // set field state:
        this.state.board[x] = this.state.board[x] || {};
        this.state.board[x][y] = {
            figure: playerFigure,
            isWinningField: false,
        };
        this.lookForWinner(move);
        if (!this.areAnyMovesLeft()) {
            if (this.state.xPoints > this.state.oPoints) {
                this.state.winner = 'X';
            }
            else if (this.state.xPoints < this.state.oPoints) {
                this.state.winner = 'O';
            }
            else {
                // It's a tie so we extend the board
                this.resetNotWinningFields();
                this.state.boardLayerCount++;
            }
        }
        this.state.currentPlayer = Game.getOppositeFigure(playerFigure);
        this.onNewStateListeners.forEach(cb => cb());
    }
    playerDisconnected(playerFigure) {
        if (this.state.winner)
            return;
        this.state.winner = Game.getOppositeFigure(playerFigure);
        this.onNewStateListeners.forEach(cb => cb());
    }
    static getRandFigure() {
        return Math.random() < 0.5 ? 'X' : 'O';
    }
    static getOppositeFigure(figure) {
        return figure === 'X' ? 'O' : 'X';
    }
}
exports.Game = Game;
