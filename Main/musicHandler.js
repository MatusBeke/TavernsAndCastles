
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
    const randomIndex = Math.floor(Math.random() * musicPlaylist.length);
    currentMusic.src = musicPlaylist[randomIndex];
    currentMusic.volume = 0.15; 
    
    currentMusic.play().then(() => {
        isMusicPlaying = true;
    }).catch(e => {
        console.log("Hudba čaká na prvú interakciu hráča.");
    });

    currentMusic.onended = () => {
        playRandomTrack();
    };
}

// Spustenie hudby pri prvom kliknutí hráča
window.addEventListener('click', () => {
    if (!isMusicPlaying) {
        playRandomTrack();
    }
}, { once: true }); 

// Funkcia na vypnutie
function toggleMusic() {
    if (currentMusic.paused) {
        currentMusic.play();
    } else {
        currentMusic.pause();
    }
}