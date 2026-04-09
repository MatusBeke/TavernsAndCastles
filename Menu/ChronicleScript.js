window.onload = () => {
    document.body.style.opacity = "1";
    loadSettings();
};

function goBack() {
    document.body.style.opacity = "0";
    setTimeout(() => {
        if (sessionStorage.getItem('cameFromGame') === 'true') {
            sessionStorage.removeItem('cameFromGame');
            window.location.href = "../Main/index.html"; 
        } else {
            window.location.href = "MenuIndex.html"; 
        }
    }, 1000);
}

const volumeSlider = document.getElementById('volume-slider');
volumeSlider.addEventListener('input', (e) => {
    localStorage.setItem('game_volume', e.target.value);
});

const fullscreenBtn = document.getElementById('fullscreen-btn');
if (fullscreenBtn && localStorage.getItem('game_fullscreen') === 'true') {
    fullscreenBtn.innerText = "On";
    fullscreenBtn.style.background = "#d4af37";
    fullscreenBtn.style.color = "#050201";
}

const particlesBtn = document.getElementById('particles-btn');
const particleContainer = document.getElementById('particle-container');

particlesBtn.addEventListener('click', () => {
    if (particlesBtn.innerText === "On") {
        particlesBtn.innerText = "Off";
        particlesBtn.style.background = "transparent";
        particlesBtn.style.color = "#d4af37";
        particleContainer.style.opacity = "0";
        localStorage.setItem('game_particles', 'off');
    } else {
        particlesBtn.innerText = "On";
        particlesBtn.style.background = "#d4af37";
        particlesBtn.style.color = "#050201";
        particleContainer.style.opacity = "1";
        localStorage.setItem('game_particles', 'on');
    }
});

const resetBtn = document.getElementById('reset-btn');
resetBtn.addEventListener('click', () => {
    if(confirm("Do you really want to erase all your progress? This action cannot be undone!")) {
        localStorage.clear();
        alert("Chronicle has been erased. Your progress is gone.");
        loadSettings(); 
    }
});

function loadSettings() {
    // Volume
    const savedVolume = localStorage.getItem('game_volume');
    if (savedVolume !== null) {
        volumeSlider.value = savedVolume;
    }

    // Particles
    const savedParticles = localStorage.getItem('game_particles');
    if (savedParticles === 'off') {
        particlesBtn.innerText = "Off";
        particlesBtn.style.background = "transparent";
        particlesBtn.style.color = "#d4af37";
        particleContainer.style.opacity = "0";
    } else {
        particlesBtn.innerText = "On";
        particlesBtn.style.background = "#d4af37";
        particlesBtn.style.color = "#050201";
        particleContainer.style.opacity = "1";
    }
}