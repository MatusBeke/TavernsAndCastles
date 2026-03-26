function startGame() {
    // Skryje celé menu
    document.getElementById('main-menu').style.opacity = '0';
    setTimeout(() => {
        document.getElementById('main-menu').style.display = 'none';
        // Tu môžeš pridať spustenie hudby
        console.log("Hra spustená...");
    }, 500);
}