// Cache DOM elementov (aby sme ich nehľadali stále dookola)
const volumeSlider = document.getElementById('volume-slider');
const fullscreenBtn = document.getElementById('fullscreen-btn');
const particlesBtn = document.getElementById('particles-btn');
const particleContainer = document.getElementById('particle-container');
const resetBtn = document.getElementById('reset-btn');

// Inicializácia zvuku
window.onload = () => {
    document.body.style.opacity = "1";
    loadSettings();
};

// Návrat do predošlej scény 
function goBack() {
    document.body.style.opacity = "0";
    setTimeout(() => {
        const isFromGame = sessionStorage.getItem('cameFromGame') === 'true';
        if (isFromGame) sessionStorage.removeItem('cameFromGame');
        
        window.location.href = isFromGame ? "../Main/index.html" : "MenuIndex.html"; 
    }, 1000);
}

//  Zabraňuje opakovaniu rovnakého kódu pri nastavovaní stavu tlačidiel (On/Off)
function setButtonState(btn, isOn) {
    if (!btn) return;
    btn.innerText = isOn ? "On" : "Off";
    btn.style.background = isOn ? "#d4af37" : "transparent";
    btn.style.color = isOn ? "#050201" : "#d4af37";
}

// Event Listenery
if (volumeSlider) {
    volumeSlider.addEventListener('input', (e) => localStorage.setItem('game_volume', e.target.value));
}

if (particlesBtn) {
    particlesBtn.addEventListener('click', () => {
        const willBeOn = particlesBtn.innerText === "Off";
        
        setButtonState(particlesBtn, willBeOn);
        if (particleContainer) particleContainer.style.opacity = willBeOn ? "1" : "0";
        
        localStorage.setItem('game_particles', willBeOn ? 'on' : 'off');
    });
}

if (resetBtn) {
    resetBtn.addEventListener('click', () => {
        if (confirm("Do you really want to erase all your progress? This action cannot be undone!")) {
            localStorage.clear();
            alert("Chronicle has been erased. Your progress is gone.");
            loadSettings(); 
        }
    });
}

// Načítanie uložených dát z LocalStorage
function loadSettings() {
    // Hlasitosť
    if (volumeSlider) {
        const savedVolume = localStorage.getItem('game_volume');
        if (savedVolume !== null) volumeSlider.value = savedVolume;
    }

    // Fullscreen
    const isFullscreen = localStorage.getItem('game_fullscreen') === 'true';
    setButtonState(fullscreenBtn, isFullscreen);

    const isParticlesOff = localStorage.getItem('game_particles') === 'off';
    setButtonState(particlesBtn, !isParticlesOff);
    if (particleContainer) particleContainer.style.opacity = isParticlesOff ? "0" : "1";
}