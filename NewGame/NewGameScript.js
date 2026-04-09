const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playHoverSound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = 'sine'; 
    osc.frequency.setValueAtTime(200, audioCtx.currentTime); 
    osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.04);
    
    gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.04);
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.04); 
}

window.onload = () => {
    document.body.style.opacity = "1";
    
    document.querySelectorAll('button').forEach(button => {
        button.addEventListener('mouseenter', playHoverSound);
    });

    setupSelection('realm-name');
    setupSelection('map-size');
    setupSelection('difficulty');
};

function setupSelection(groupId) {
    const group = document.getElementById(groupId);
    const buttons = group.querySelectorAll('.option-btn');
    
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}

function goBack() {
    document.body.style.opacity = "0";
    setTimeout(() => {
        window.location.href = "../Menu/MenuIndex.html";
    }, 1000);
}

function startWorld() {
    const selectedMapSize = document.querySelector('#map-size .active').getAttribute('data-value');
    const selectedDifficulty = document.querySelector('#difficulty .active').getAttribute('data-value');

    sessionStorage.setItem('game_mapSize', selectedMapSize);
    sessionStorage.setItem('game_difficulty', selectedDifficulty);

    document.body.style.transition = "opacity 1.5s ease";
    document.body.style.opacity = "0";
    setTimeout(() => {
        window.location.href = "../Main/index.html";
    }, 1500);
}