function startGame() {
    const menu = document.getElementById('main-menu');
    menu.style.opacity = '0';

    setTimeout(() => {
        window.location.href = "../Main/index.html";
    }, 600);
}

function openOptions() {
    console.log("Options clicked");
}

function quitGame() {
    console.log("Quit clicked");
}