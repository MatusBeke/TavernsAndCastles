// Pomocná funkcia na nahradenie setTimeout za modernejší await
const delay = (ms) => new Promise(res => setTimeout(res, ms));

// Spustenie hry s vizuálnym prechodom
async function startGame() {
    Object.assign(document.body.style, {
        transition: "opacity 1.5s ease, filter 1.5s ease",
        opacity: "0",
        filter: "brightness(0.3) blur(10px) sepia(50%)"
    });
    
    await delay(1500);
    window.location.href = "../Main/index.html";
}

// Animácia a prechod do nastavení
async function openOptions() {
    const content = document.querySelector('.nav-container');
    
    content.style.transition = "transform 0.1s ease";
    content.style.transform = "translateX(-10px)";
    
    await delay(100);
    content.style.transform = "translateX(0)"; 
    
    document.body.style.transition = "opacity 1s ease";
    document.body.style.opacity = "0";
    
    await delay(1000);
    window.location.href = "Chronicle.html";
}

// Troll
async function quitGame() {
    const overlay = document.createElement('div');
    
    Object.assign(overlay.style, {
        position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh',
        backgroundColor: '#000', display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center', zIndex: '9999',
        opacity: '0', transition: 'opacity 1.5s ease'
    });
    
    overlay.innerHTML = `
        <div style="font-family: 'MedievalSharp', cursive; font-size: 8rem; color: #8b0000; text-shadow: 0 0 30px #ff0000; margin-bottom: 20px;">
            FUCK YOU
        </div>
        <div style="font-family: 'MedievalSharp', cursive; font-size: 2.5rem; color: #d4af37;">
            Are you really not closing with the window X?
        </div>
    `;

    document.body.appendChild(overlay);

    await delay(50);
    overlay.style.opacity = '1';

    await delay(4000);
    window.open('', '_self', '');
    window.close();
    
    document.documentElement.innerHTML = "";
    document.documentElement.style.backgroundColor = "black";
    window.location.replace("about:blank");
}

// Generovanie zvuku pri prejdení myšou 
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playHoverSound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    const now = audioCtx.currentTime;

    osc.type = 'sine'; 
    osc.frequency.setValueAtTime(200, now); 
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.04);

    gainNode.gain.setValueAtTime(0.15, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.04); 
}

// Priradenie zvuku všetkým tlačidlám
window.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('mouseenter', playHoverSound);
    });
});