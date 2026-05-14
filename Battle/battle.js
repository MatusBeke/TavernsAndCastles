const canvas = document.getElementById('battleCanvas');
const ctx = canvas.getContext('2d');

// --- BATTLE VARIABLES ---
let battlePhase = "field"; 
let playerArmy = [];
let enemyArmy = [];
let isFighting = false; 

// --- CONSTANTS ---
const NPC_W = 10; 
const NPC_H = 15; 
const MAP_SIZE = 25; 
const TILE_SIZE = 128;
let mapData = []; 
let camera = { x: 0, y: 0, zoom: 1 }; 
let minZoom = 1; // Minimálny zoom, aby neboli čierne okraje

// --- CAMERA CONTROLS ---
let isDragging = false;
let lastMouse = { x: 0, y: 0 };

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
    
    const scaleX = canvas.width / (MAP_SIZE * TILE_SIZE);
    const scaleY = canvas.height / (MAP_SIZE * TILE_SIZE);
    minZoom = Math.max(scaleX, scaleY); // Zabezpečí, že mapa vždy zakryje celú obrazovku
    
    camera.zoom = minZoom; 
    
    centerCamera();
}

function centerCamera() {
    camera.x = (canvas.width / 2) - ((MAP_SIZE * TILE_SIZE * camera.zoom) / 2);
    camera.y = (canvas.height / 2) - ((MAP_SIZE * TILE_SIZE * camera.zoom) / 2);
    clampCamera();
}

function clampCamera() {
    const mapPixelWidth = MAP_SIZE * TILE_SIZE * camera.zoom;
    const mapPixelHeight = MAP_SIZE * TILE_SIZE * camera.zoom;

    const minCamX = canvas.width - mapPixelWidth;
    const minCamY = canvas.height - mapPixelHeight;

    if (camera.x > 0) camera.x = 0;
    if (camera.y > 0) camera.y = 0;
    if (camera.x < minCamX) camera.x = minCamX;
    if (camera.y < minCamY) camera.y = minCamY;
}

window.addEventListener('resize', resizeCanvas);

// --- MOUSE EVENTS ---
canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const zoomSpeed = 0.1;
    const oldZoom = camera.zoom;

    if (e.deltaY < 0) {
        camera.zoom += zoomSpeed;
        if (camera.zoom > 3) camera.zoom = 3; // Maximálne priblíženie
    } else {
        camera.zoom -= zoomSpeed;
        if (camera.zoom < minZoom) camera.zoom = minZoom; // Zastaví odďaľovanie
    }

    const mouseX = e.clientX;
    const mouseY = e.clientY - document.getElementById('battle-ui').offsetHeight;
    
    camera.x -= (mouseX - camera.x) * (camera.zoom / oldZoom - 1);
    camera.y -= (mouseY - camera.y) * (camera.zoom / oldZoom - 1);

    clampCamera();
}, { passive: false });

canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    lastMouse = { x: e.clientX, y: e.clientY };
});

window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - lastMouse.x;
    const dy = e.clientY - lastMouse.y;
    camera.x += dx;
    camera.y += dy;
    clampCamera();
    lastMouse = { x: e.clientX, y: e.clientY };
});

window.addEventListener('mouseup', () => isDragging = false);

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

    const minZ = TILE_SIZE * 4; 
    const maxZ = TILE_SIZE * (MAP_SIZE - 4);

    const playerMinX = TILE_SIZE * 2;
    const playerMaxX = TILE_SIZE * 6;

    for(let i = 0; i < playerCount; i++) {
        playerArmy.push({
            x: playerMinX + Math.random() * (playerMaxX - playerMinX),
            y: minZ + Math.random() * (maxZ - minZ),
            hp: 100,
            speed: 2 + Math.random() * 2,
            damage: 1 + Math.random() * 2
        });
    }

    const enemyMinX = TILE_SIZE * (MAP_SIZE - 6);
    const enemyMaxX = TILE_SIZE * (MAP_SIZE - 2);

    for(let i = 0; i < enemyCount; i++) {
        enemyArmy.push({
            x: enemyMinX + Math.random() * (enemyMaxX - enemyMinX),
            y: minZ + Math.random() * (maxZ - minZ),
            hp: 100,
            speed: 2 + Math.random() * 2,
            damage: 1 + Math.random() * 2
        });
    }
}

// --- BATTLE UI LOGIC ---
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
    
    spawnArmies(troopCount, enemyCount);

    document.getElementById('start-clash-btn').style.display = 'block';
}

function startClash() {
    document.getElementById('start-clash-btn').style.display = 'none';
    isFighting = true; 
}

// --- ACTUAL COMBAT LOGIC ---
function updateCombat() {
    processArmyActions(playerArmy, enemyArmy);
    processArmyActions(enemyArmy, playerArmy);

    playerArmy = playerArmy.filter(u => u.hp > 0);
    enemyArmy = enemyArmy.filter(u => u.hp > 0);

    document.getElementById('army-count').innerText = "Your Army: " + playerArmy.length;
    document.getElementById('enemy-count').innerText = "Enemy: " + enemyArmy.length;

    if (enemyArmy.length === 0 && playerArmy.length > 0) {
        isFighting = false;
        setTimeout(() => {
            alert("Victory! The enemy is falling back to their Castle Keep. Moving to ATTACK phase!");
            window.location.href = "battle.html?type=attack"; 
        }, 1000);
    } else if (playerArmy.length === 0 && enemyArmy.length > 0) {
        isFighting = false;
        setTimeout(() => {
            alert("Defeat! The enemy broke through your lines. Moving to DEFEND phase!");
            window.location.href = "battle.html?type=defend"; 
        }, 1000);
    }
}

function processArmyActions(attackers, defenders) {
    if (defenders.length === 0) return;

    attackers.forEach(unit => {
        let closest = null;
        let minDist = Infinity;
        
        defenders.forEach(def => {
            let dist = Math.hypot(def.x - unit.x, def.y - unit.y);
            if (dist < minDist) {
                minDist = dist;
                closest = def;
            }
        });

        if (closest) {
            if (minDist > 15) { 
                let dx = closest.x - unit.x;
                let dy = closest.y - unit.y;
                let length = Math.hypot(dx, dy);
                unit.x += (dx / length) * unit.speed;
                unit.y += (dy / length) * unit.speed;
            } else {
                closest.hp -= unit.damage;
            }
        }
    });
}

// --- RENDERING LOOP ---
function drawLoop() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.translate(Math.floor(camera.x), Math.floor(camera.y));
    ctx.scale(camera.zoom, camera.zoom);
    ctx.imageSmoothingEnabled = false; 

    for (let y = 0; y < MAP_SIZE; y++) {
        for (let x = 0; x < MAP_SIZE; x++) {
            const tile = mapData[y][x];
            if (tile.img) {
                ctx.drawImage(tile.img, x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE + 1, TILE_SIZE + 1);
            }
        }
    }

    if (isFighting) {
        updateCombat();
    }

    playerArmy.forEach(unit => {
        ctx.drawImage(imgPeasant, unit.x, unit.y, NPC_W, NPC_H);
    });

    enemyArmy.forEach(unit => {
        ctx.save();
        ctx.filter = 'sepia(1) hue-rotate(-50deg) saturate(3)'; 
        ctx.drawImage(imgPeasant, unit.x, unit.y, NPC_W, NPC_H);
        ctx.restore();
    });

    requestAnimationFrame(drawLoop);
}

function retreat() {
    if(confirm("Are you sure you want to retreat? You will lose honor and troops!")) {
        window.close(); 
    }
}

let loadedImages = 0;
function onImageLoad() {
    loadedImages++;
    if (loadedImages === 2) {
        initBattle();
    }
}

imgLand.onload = onImageLoad;
imgPeasant.onload = onImageLoad;