// --- MUSIC MANAGER (Background Music) ---

// Zoznam tvojich súborov podľa obrázka image_584e90.png
const musicPlaylist = [
    '../Resources/SFX/Background/SFX_BackgroundMusic1.mp3',
    '../Resources/SFX/Background/SFX_BackgroundMusic2.mp3',
    '../Resources/SFX/Background/SFX_BackgroundMusic3.mp3',
    '../Resources/SFX/Background/SFX_BackgroundMusic4.mp3',
    '../Resources/SFX/Background/SFX_BackgroundMusic5.mp3',
    '../Resources/SFX/Background/SFX_BackgroundMusic6.mp3',
    '../Resources/SFX/Background/SFX_BackgroundMusic7.mp3',
    '../Resources/SFX/Background/SFX_BackgroundMusic8.mp3'
];

let currentMusic = new Audio();
let isMusicPlaying = false;

// Funkcia na spustenie náhodnej skladby
function playRandomTrack() {
    // Vyberieme náhodný index z playlistu
    const randomIndex = Math.floor(Math.random() * musicPlaylist.length);
    currentMusic.src = musicPlaylist[randomIndex];
    currentMusic.volume = 0.15; // Jemná hlasitosť na pozadí
    
    currentMusic.play().then(() => {
        isMusicPlaying = true;
    }).catch(e => {
        console.log("Hudba čaká na prvú interakciu hráča.");
    });

    // Keď skladba skončí, automaticky pustí ďalšiu náhodnú
    currentMusic.onended = () => {
        playRandomTrack();
    };
}

// Spustenie hudby pri prvom kliknutí hráča kamkoľvek do hry
window.addEventListener('click', () => {
    if (!isMusicPlaying) {
        playRandomTrack();
    }
}, { once: true }); // "once: true" zabezpečí, že sa tento listener po prvom kliku vymaže

// Funkcia na stíšenie/vypnutie (môžeš zavolať z GUI tlačidla)
function toggleMusic() {
    if (currentMusic.paused) {
        currentMusic.play();
    } else {
        currentMusic.pause();
    }
}