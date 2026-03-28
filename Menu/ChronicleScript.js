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
if (localStorage.getItem('game_fullscreen') === 'true') {
    fullscreenBtn.innerText = "On";
    fullscreenBtn.style.background = "#d4af37";
    fullscreenBtn.style.color = "#050201";
}

fullscreenBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => console.log(err));
        localStorage.setItem('game_fullscreen', 'true');
        fullscreenBtn.innerText = "On";
        fullscreenBtn.style.background = "#d4af37";
        fullscreenBtn.style.color = "#050201";
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
            localStorage.setItem('game_fullscreen', 'false');
            fullscreenBtn.innerText = "Off";
            fullscreenBtn.style.background = "transparent";
            fullscreenBtn.style.color = "#d4af37";
        }
    }
});

const particlesBtn = document.getElementById('particles-btn');
const particleContainer = document.getElementById('particle-container');

particlesBtn.addEventListener('click', () => {
    if (particlesBtn.innerText === "Zapnuté") {
        particlesBtn.innerText = "Vypnuté";
        particlesBtn.style.background = "transparent";
        particlesBtn.style.color = "#d4af37";
        particleContainer.style.opacity = "0";
        localStorage.setItem('game_particles', 'off');
    } else {
        particlesBtn.innerText = "Zapnuté";
        particlesBtn.style.background = "#d4af37";
        particlesBtn.style.color = "#050201";
        particleContainer.style.opacity = "1";
        localStorage.setItem('game_particles', 'on');
    }
});

const resetBtn = document.getElementById('reset-btn');
resetBtn.addEventListener('click', () => {
    if(confirm("Naozaj chceš zmazať všetok svoj postup? Táto akcia sa nedá vrátiť späť!")) {
        localStorage.clear();
        alert("Kronika bola zmazaná. Tvoj postup je preč.");
        loadSettings(); 
    }
});

function loadSettings() {
    // Hlasitosť
    const savedVolume = localStorage.getItem('game_volume');
    if (savedVolume !== null) {
        volumeSlider.value = savedVolume;
    }

    // Častice
    const savedParticles = localStorage.getItem('game_particles');
    if (savedParticles === 'off') {
        particlesBtn.innerText = "Vypnuté";
        particlesBtn.style.background = "transparent";
        particlesBtn.style.color = "#d4af37";
        particleContainer.style.opacity = "0";
    } else {
        particlesBtn.innerText = "Zapnuté";
        particlesBtn.style.background = "#d4af37";
        particlesBtn.style.color = "#050201";
        particleContainer.style.opacity = "1";
    }
}