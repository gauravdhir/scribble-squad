document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('start-btn');
    const board = document.getElementById('game-board');

    startBtn.addEventListener('click', () => {
        console.log('Game Started');
        // Logic to start the game will go here
        board.innerHTML = '<div class="empty-state">Game initialized!</div>';
    });
});
