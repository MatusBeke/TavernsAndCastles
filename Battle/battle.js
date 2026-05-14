const canvas = document.getElementById('battleCanvas');
const ctx = canvas.getContext('2d');

// --- BATTLE VARIABLES ---
let battlePhase = "field"; 
let playerArmy = [];
let enemyArmy = [];

// --- MAP & CAMERA VARIABLES ---
const MAP_SIZE = 25; 
const TILE_SIZE = 128;
let mapData = []; 
let camera = { x: 0, y: 0, zoom: 1 }; 

// --- IMAGES ---
const imgLand = new Image(); imgLand.src = '../Resources/Tiles/Img_LandDefault.png';
const imgForest1 = new Image(); imgForest1.src = '../Resources/Tiles/Img_Forest1.png';
const imgForest2 = new Image(); imgForest2.src = '../Resources/Tiles/Img_Forest2.png';
const imgForest3 = new Image(); imgForest3.src = '../Resources/Tiles/Img_Forest3.png';
const imgForest4 = new Image(); imgForest4.src = '../Resources/Tiles/Img_Forest4.png';
const imgPeasant = new Image(); imgPeasant.src = '../Resources/NPCs/peasant.png';

// --- INITIALIZATION ---
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - document.getElementById('battle-ui').offsetHeight;
    
    // Použitie Math.min zabezpečí, že celá mapa sa vždy zmestí na obrazovku
    const scaleX = canvas.width / (MAP_SIZE * TILE_SIZE);
    const scaleY = canvas.height / (MAP_SIZE * TILE_SIZE);
    camera.zoom = Math.min(scaleX, scaleY); 
    
    // Pevné uzamknutie kamery presne na stred mapy
    camera.x = (canvas.width / 2) - ((MAP_SIZE * TILE_SIZE * camera.zoom) / 2);
    camera.y = (canvas.height / 2) - ((MAP_SIZE * TILE_SIZE * camera.zoom) / 2);
}
window.addEventListener('resize', resizeCanvas);

function initBattle() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('type')) {
        battlePhase = urlParams.get('type');
    }
    
    document.getElementById('phase-text').innerText = battlePhase.toUpperCase();
    document.getElementById('army-setup-modal').style.display = 'block'; 
    
    generateBattleMap();
    resizeCanvas();
}

// --- MAP GENERATION ---
function generateBattleMap() {
    noise.seed(Math.random());
    const NOISE_ZOOM = 0.1;
    const centerPoint = MAP_SIZE / 2;

    for (let y = 0; y < MAP_SIZE; y++) {
        mapData[y] = [];
        for (let x = 0; x < MAP_SIZE; x++) {
            let n = (noise.perlin2(x * NOISE_ZOOM, y * NOISE_ZOOM) + 1) / 2;
            let tileImg = imgLand; 
            
            let distanceToCenter = Math.sqrt(Math.pow(x - centerPoint, 2) + Math.pow(y - centerPoint, 2));

            // Lesy len na okrajoch
            if (distanceToCenter > 6 && n < 0.5) {
                let chance = Math.random();
                if (chance < 0.05) tileImg = imgForest4; 
                else if (chance < 0.20) tileImg = imgForest1; 
                else if (chance < 0.30) tileImg = imgForest3; 
                else tileImg = imgForest2; 
            }

            mapData[y][x] = { img: tileImg };
        }
    }

    requestAnimationFrame(drawLoop);
}

// --- SPAWN ARMIES ---
function spawnArmies(playerCount, enemyCount) {
    playerArmy = [];
    enemyArmy = [];

    const minZ = TILE_SIZE * 4; // Bezpečný okraj zhora/zdola
    const maxZ = TILE_SIZE * (MAP_SIZE - 4);

    // Hráč: Ľavá strana mapy (od 2. do 8. bloku)
    const playerMinX = TILE_SIZE * 2;
    const playerMaxX = TILE_SIZE * 8;

    for(let i = 0; i < playerCount; i++) {
        playerArmy.push({
            x: playerMinX + Math.random() * (playerMaxX - playerMinX),
            y: minZ + Math.random() * (maxZ - minZ)
        });
    }

    // Nepriateľ: Pravá strana mapy
    const enemyMinX = TILE_SIZE * (MAP_SIZE - 8);
    const enemyMaxX = TILE_SIZE * (MAP_SIZE - 2);

    for(let i = 0; i < enemyCount; i++) {
        enemyArmy.push({
            x: enemyMinX + Math.random() * (enemyMaxX - enemyMinX),
            y: minZ + Math.random() * (maxZ - minZ)
        });
    }
}

// --- RENDERING LOOP ---
function drawLoop() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.translate(Math.floor(camera.x), Math.floor(camera.y));
    ctx.scale(camera.zoom, camera.zoom);
    ctx.imageSmoothingEnabled = false; 

    // Vykreslenie mapy
    for (let y = 0; y < MAP_SIZE; y++) {
        for (let x = 0; x < MAP_SIZE; x++) {
            const tile = mapData[y][x];
            if (tile.img) {
                ctx.drawImage(tile.img, x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE + 1, TILE_SIZE + 1);
            }
        }
    }

    // Vykreslenie hráčovej armády (naľavo)
    playerArmy.forEach(unit => {
        ctx.drawImage(imgPeasant, unit.x, unit.y, TILE_SIZE / 2, TILE_SIZE / 2); // Zmenšené na 50% veľkosti bloku
    });

    // Vykreslenie nepriateľa (napravo) + zafarbenie na červeno nech sa odlíšia
    enemyArmy.forEach(unit => {
        ctx.save();
        ctx.filter = 'sepia(1) hue-rotate(-50deg) saturate(3)'; // Červenkastý filter
        ctx.drawImage(imgPeasant, unit.x, unit.y, TILE_SIZE / 2, TILE_SIZE / 2);
        ctx.restore();
    });

    requestAnimationFrame(drawLoop);
}

// --- BATTLE LOGIC ---
function confirmArmy() {
    let troopCount = parseInt(document.getElementById('troop-input').value);
    
    if (isNaN(troopCount) || troopCount < 1) {
        alert("You must send at least 1 soldier!");
        return;
    }
    
    document.getElementById('army-setup-modal').style.display = 'none';
    document.getElementById('army-count').innerText = "Your Army: " + troopCount; 
    
    let enemyCount = troopCount + Math.floor(Math.random() * 10 - 5);
    if (enemyCount < 1) enemyCount = 1;
    document.getElementById('enemy-count').innerText = "Enemy: " + enemyCount;
    
    console.log("Army ready. Starting phase: " + battlePhase);

    // Naspawnujeme armády podla zadaných počtov
    spawnArmies(troopCount, enemyCount);

    if (battlePhase === "field") runFieldBattle();
    else if (battlePhase === "attack") runAttack();
    else if (battlePhase === "defend") runDefend();
}

function runFieldBattle() {
    console.log("⚔️ Field battle started!");
    
    setTimeout(() => {
        let isVictory = Math.random() > 0.5; 
        
        if (isVictory) {
            alert("Victory! The enemy is falling back to their Castle Keep. Moving to ATTACK phase!");
            window.location.href = "battle.html?type=attack"; 
        } else {
            alert("Defeat! The enemy broke through your lines. Moving to DEFEND phase!");
            window.location.href = "battle.html?type=defend";
        }
    }, 3000); // 3 sekundy na obzretie poľa, potom vyskočí výsledok
}

function runAttack() {
    console.log("🔥 Attacking the Castle Keep!");
}

function runDefend() {
    console.log("🛡️ Defending the city!");
}

function retreat() {
    if(confirm("Are you sure you want to retreat? You will lose honor and troops!")) {
        window.close(); 
    }
}

// Počkáme, kým sa načítajú základné obrázky, až potom spustíme bitku
let loadedImages = 0;
function onImageLoad() {
    loadedImages++;
    if (loadedImages === 2) {
        initBattle();
    }
}

imgLand.onload = onImageLoad;
imgPeasant.onload = onImageLoad;