// Nastavenie zvuku a prehrávanie pri prejdení myšou
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

// Inicializácia skupiny tlačidiel 
function setupSelection(groupId) { 
    const group = document.getElementById(groupId);
    if (!group) return;
    
    const buttons = group.querySelectorAll('.option-btn');
    
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}

// Spustenie po načítaní stránky
window.onload = () => { 
    document.body.style.opacity = "1";
    
    document.querySelectorAll('button').forEach(button => {
        button.addEventListener('mouseenter', playHoverSound);
    });

    ['save-mode', 'realm-name', 'map-size', 'difficulty'].forEach(setupSelection);
};

// Návrat do menu
function goBack() { 
    document.body.style.opacity = "0";
    setTimeout(() => window.location.href = "../Menu/MenuIndex.html", 1000);
}

// Spustenie hry a uloženie nastavení sveta do sessionStorage
// TODO: Ukladanie nastavení do sessionStorage (aby sa načítali v hre)
function startWorld() { 
    const realmInput = document.getElementById('realm-name').value.trim();
    const realmName = realmInput || "Unknown Realm";

    const getActiveValue = (id) => document.querySelector(`#${id} .active`)?.getAttribute('data-value');

    sessionStorage.setItem('game_realmName', realmName);
    sessionStorage.setItem('game_mapSize', getActiveValue('map-size'));
    sessionStorage.setItem('game_difficulty', getActiveValue('difficulty'));
    sessionStorage.setItem('game_saveEnabled', getActiveValue('save-mode'));

    document.body.style.transition = "opacity 1.5s ease";
    document.body.style.opacity = "0";
    
    setTimeout(() => window.location.href = "../Main/index.html", 1500);
}