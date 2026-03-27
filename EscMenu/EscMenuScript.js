let isGamePaused = false;

const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = '../EscMenu/EscMenuStyle.css'; 
document.head.appendChild(link);

const escMenuHTML = `
<div id="esc-menu-overlay">
    <div class="esc-menu-box">
        <h2 class="esc-title">Game Paused</h2>
        <div class="ornament">✠ ══════ ✠</div>
        <div class="esc-nav">
            <button class="esc-btn" onclick="toggleEscMenu()">
                <span class="icon">⚔</span> Resume
            </button>
            <button class="esc-btn" onclick="openInGameOptions()">
                <span class="icon">📜</span> Settings
            </button>
            <button class="esc-btn" onclick="quitToMainMenu()">
                <span class="icon">🗝</span> Return to Menu
            </button>
        </div>
    </div>
</div>
`;
document.body.insertAdjacentHTML('beforeend', escMenuHTML);

// 3. Počúvanie na stlačenie klávesy ESC
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        toggleEscMenu();
    }
});

function toggleEscMenu() {
    const escMenu = document.getElementById('esc-menu-overlay');
    const escBox = document.querySelector('.esc-menu-box');
    
    isGamePaused = !isGamePaused;
    
    if (isGamePaused) {
        escMenu.style.display = 'flex';
        setTimeout(() => {
            escMenu.style.opacity = '1';
            escBox.style.transform = 'scale(1)';
        }, 10);
    } else {
        escMenu.style.opacity = '0';
        escBox.style.transform = 'scale(0.9)';
        setTimeout(() => {
            escMenu.style.display = 'none';
        }, 300);
    }
}

function openInGameOptions() {
    document.body.style.transition = "opacity 1s ease";
    document.body.style.opacity = "0";
    setTimeout(() => {
        sessionStorage.setItem('cameFromGame', 'true');
        window.location.href = "../Menu/Chronicle.html"; 
    }, 1000);
}

function quitToMainMenu() {
    document.body.style.transition = "opacity 1s ease";
    document.body.style.opacity = "0";
    setTimeout(() => {
        window.location.href = "../Menu/MenuIndex.html"; 
    }, 1000);
}