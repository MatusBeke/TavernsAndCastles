const canvas = document.getElementById('battleCanvas');
const ctx = canvas.getContext('2d');

// --- BATTLE VARIABLES ---
let battlePhase = "field"; 
let playerArmy = [];
let enemyArmy = [];
let isFighting = false; 
let isTargetingExplosion = false;

// --- CONSTANTS & ROLES ---
const NPC_W = 10; 
const NPC_H = 15; 
const MAP_SIZE = 25; 
const TILE_SIZE = 128;
let mapData = []; 
let camera = { x: 0, y: 0, zoom: 1 }; 
let minZoom = 1; 

// Štatistiky pre jednotlivé roly (hp, rýchlosť, poškodenie, dostrel, vizuálna veľkosť)
const ROLES = {
    MILITIA: { name: 'Militia', hp: 60, speed: 2.5, damage: 2, range: 15, sizeScale: 0.9 },
    GUARDS: { name: 'Guards', hp: 120, speed: 1.5, damage: 4, range: 15, sizeScale: 1.1 },
    MEN_AT_ARMS: { name: 'Men-at-Arms', hp: 100, speed: 2.0, damage: 5, range: 15, sizeScale: 1.1 },
    RANGED: { name: 'Ranged', hp: 50, speed: 2.0, damage: 3, range: 120, sizeScale: 1.0 }, // Útočia z diaľky
    KNIGHT: { name: 'Knight', hp: 150, speed: 1.8, damage: 8, range: 18, sizeScale: 1.3 },
    CAVALRY: { name: 'Cavalry', hp: 130, speed: 4.5, damage: 6, range: 20, sizeScale: 1.8 }, // Rýchli a veľkí
    WAR_MACHINE: { name: 'War-Machine', hp: 300, speed: 0.5, damage: 15, range: 150, sizeScale: 2.5 }, // Pomalí, veľkí, útok z diaľky
    KING: { name: 'King', hp: 500, speed: 1.2, damage: 12, range: 20, sizeScale: 1.5 } // Boss
};

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

function resizeCanvas() {
    canvas.width = window.innerWidth;
    // Odpočítame horný aj dolný panel
    const topUI = document.getElementById('battle-ui').offsetHeight;
    const botUI = document.getElementById('ability-bar').offsetHeight;
    canvas.height = window.innerHeight - topUI - botUI;
    
    const scaleX = canvas.width / (MAP_SIZE * TILE_SIZE);
    const scaleY = canvas.height / (MAP_SIZE * TILE_SIZE);
    minZoom = Math.max(scaleX, scaleY); 
    
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
        if (camera.zoom > 3) camera.zoom = 3; 
    } else {
        camera.zoom -= zoomSpeed;
        if (camera.zoom < minZoom) camera.zoom = minZoom; 
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

// Nový event pre kliknutie (vyhodenie ability)
canvas.addEventListener('click', (e) => {
    if (isTargetingExplosion) {
        // Vypočítame reálnu pozíciu na mape (musíme zohľadniť zoom a posun kamery)
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Toto sú presné súradnice v tvojom hernom svete
        const worldX = (mouseX / camera.zoom) - (camera.x / camera.zoom);
        const worldY = (mouseY / camera.zoom) - (camera.y / camera.zoom);

        // Odpálime výbuch!
        executeExplosion(worldX, worldY, e.clientX, e.clientY);
        
        // Vypneme zameriavanie
        isTargetingExplosion = false;
        canvas.classList.remove('targeting-mode');
    }
});

// Samotné vykonanie výbuchu na zadaných súradniciach
function executeExplosion(worldX, worldY, screenX, screenY) {
    const btn = document.getElementById('btn-explosion');
    btn.disabled = true; // Zablokuje tlačidlo
    
    // 1. Znížime HP nepriateľom, ktorí sú blízko (v okruhu napr. 200 pixelov)
    const explosionRadius = 200; 
    enemyArmy.forEach(enemy => {
        let dist = Math.hypot(enemy.x - worldX, enemy.y - worldY);
        if (dist <= explosionRadius) {
            enemy.hp /= 2; // Polovica HP dole
        }
    });

    console.log("🔥 BOOM na súradniciach X:" + Math.floor(worldX) + " Y:" + Math.floor(worldY));

    // 2. Vykreslenie GIFu presne tam, kde si klikol myšou
    const fxContainer = document.getElementById('fx-container');
    const explosionImg = document.createElement('img');
    
    explosionImg.src = '../Resources/Abilities/Explosion.gif?' + new Date().getTime(); 
    explosionImg.className = 'explosion-gif';
    explosionImg.style.left = screenX + 'px';
    explosionImg.style.top = screenY + 'px';
    
    fxContainer.appendChild(explosionImg);
    
    // 3. Zmazanie GIFu po dvoch sekundách
    setTimeout(() => {
        if (fxContainer.contains(explosionImg)) {
            fxContainer.removeChild(explosionImg);
        }
    }, 2000); 
}

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
function getRandomRole() {
    // Vráti náhodnú rolu okrem Kráľa (Kráľ sa spawnuje vždy len 1x garantovane)
    const roleKeys = Object.keys(ROLES).filter(k => k !== 'KING');
    const randomKey = roleKeys[Math.floor(Math.random() * roleKeys.length)];
    return ROLES[randomKey];
}

function createUnit(minX, maxX, minZ, maxZ, roleDef) {
    return {
        x: minX + Math.random() * (maxX - minX),
        y: minZ + Math.random() * (maxZ - minZ),
        role: roleDef.name,
        hp: roleDef.hp,
        maxHp: roleDef.hp,
        speed: roleDef.speed + (Math.random() * 0.4 - 0.2), // Drobná odchýlka rýchlosti
        damage: roleDef.damage,
        range: roleDef.range,
        sizeScale: roleDef.sizeScale
    };
}

function spawnArmies(playerCount, enemyCount) {
    playerArmy = [];
    enemyArmy = [];

    const minZ = TILE_SIZE * 4; 
    const maxZ = TILE_SIZE * (MAP_SIZE - 4);
    const playerMinX = TILE_SIZE * 2;
    const playerMaxX = TILE_SIZE * 6;
    const enemyMinX = TILE_SIZE * (MAP_SIZE - 6);
    const enemyMaxX = TILE_SIZE * (MAP_SIZE - 2);

    // Hráč: 1x King, zvyšok náhodné roly
    playerArmy.push(createUnit(playerMinX, playerMaxX, minZ, maxZ, ROLES.KING));
    for(let i = 1; i < playerCount; i++) {
        playerArmy.push(createUnit(playerMinX, playerMaxX, minZ, maxZ, getRandomRole()));
    }

    // Nepriateľ: 1x King, zvyšok náhodné roly
    enemyArmy.push(createUnit(enemyMinX, enemyMaxX, minZ, maxZ, ROLES.KING));
    for(let i = 1; i < enemyCount; i++) {
        enemyArmy.push(createUnit(enemyMinX, enemyMaxX, minZ, maxZ, getRandomRole()));
    }
}

// --- BATTLE UI LOGIC ---
function confirmArmy() {
    let troopCount = parseInt(document.getElementById('troop-input').value);
    
    if (isNaN(troopCount) || troopCount < 1) {
        alert("You must send at least 1 soldier!");
        return;
    }
    
    // Obmedzenie na 400
    if (troopCount > 400) {
        troopCount = 400;
        document.getElementById('troop-input').value = 400;
    }
    
    document.getElementById('army-setup-modal').style.display = 'none';
    document.getElementById('army-count').innerText = "Your Army: " + troopCount; 
    
    let enemyCount = troopCount + Math.floor(Math.random() * 20 - 10);
    if (enemyCount < 1) enemyCount = 1;
    if (enemyCount > 400) enemyCount = 400;
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
            // Ak je mimo dosah, beží k cieľu
            if (minDist > unit.range) { 
                let dx = closest.x - unit.x;
                let dy = closest.y - unit.y;
                let length = Math.hypot(dx, dy);
                unit.x += (dx / length) * unit.speed;
                unit.y += (dy / length) * unit.speed;
            } else {
                // Ak je v dosahu (Range), zastaví sa a útočí
                // Násobíme 0.1, lebo sa to volá 60-krát za sekundu (aby nezomreli hneď)
                closest.hp -= unit.damage * 0.1;
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

    // Vykreslenie tvojej armády s dynamickou veľkosťou podľa roly
    playerArmy.forEach(unit => {
        const w = NPC_W * unit.sizeScale;
        const h = NPC_H * unit.sizeScale;
        ctx.drawImage(imgPeasant, unit.x - w/2, unit.y - h/2, w, h);
    });

    // Vykreslenie nepriateľa s červeným filtrom a dynamickou veľkosťou
    enemyArmy.forEach(unit => {
        const w = NPC_W * unit.sizeScale;
        const h = NPC_H * unit.sizeScale;
        ctx.save();
        ctx.filter = 'sepia(1) hue-rotate(-50deg) saturate(3)'; 
        ctx.drawImage(imgPeasant, unit.x - w/2, unit.y - h/2, w, h);
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
// --- ABILITIES ---
function castExplosion() {
    if (!isFighting) {
        alert("Wait for the battle to start!");
        return;
    }
    
    const btn = document.getElementById('btn-explosion');
    btn.disabled = true; // Zablokuje tlačidlo (cooldown)
    
    // 1. Znížime HP všetkým nepriateľom na polovicu
    enemyArmy.forEach(enemy => {
        enemy.hp /= 2;
    });
    
    console.log("🔥 EXPLOSION CASTED! Enemy HP halved!");

    // 2. Vytvorenie a vykreslenie GIFu
    const fxContainer = document.getElementById('fx-container');
    const explosionImg = document.createElement('img');
    
    // Pridáme náhodný string za URL, aby prehliadač prehral GIF odznova a nenačítaval statickú kópiu
    explosionImg.src = '../Resources/Abilities/Explosion.gif?' + new Date().getTime(); 
    explosionImg.className = 'explosion-gif';
    
    fxContainer.appendChild(explosionImg);
    
    setTimeout(() => {
        fxContainer.innerHTML = ''; 
        
        btn.disabled = false; 
    }, 500); // 2 sekundy (2000 ms) - uprav podľa toho, aký dlhý máš ten GIF
}
// --- ABILITIES ---
function castExplosion() {
    if (!isFighting) {
        alert("Wait for the battle to start!");
        return;
    }
    
    isTargetingExplosion = true;
    canvas.classList.add('targeting-mode'); // Zmení myšku na zameriavač
    console.log("Klikni na mapu, kam chceš hodiť výbuch!");
}

imgLand.onload = onImageLoad;
imgPeasant.onload = onImageLoad;