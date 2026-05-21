const canvas = document.getElementById('battleCanvas');
const ctx = canvas.getContext('2d');
const sfxExplosion = new Audio('../Resources/SFX/SFX_Explosion.mp3');

let playerArmy = [];
let enemyArmy = [];
let projectiles = [];
let isFighting = false;
let isTargetingExplosion = false;
let battleEnded = false;

// Premenné pre vlny
let totalEnemiesToSpawn = 0;
let enemiesSpawnedSoFar = 0;
let waveInterval;

const MAP_SIZE = 30; // Mapa môže byť trošku väčšia pre obranu
const TILE_SIZE = 128;
let mapData = [];
let camera = { x: 0, y: 0, zoom: 1 };
let minZoom = 1;

const imgLand = new Image(); imgLand.src = '../Resources/Tiles/Img_LandDefault.png';
const imgForest1 = new Image(); imgForest1.src = '../Resources/Tiles/Img_Forest1.png';
const imgForest2 = new Image(); imgForest2.src = '../Resources/Tiles/Img_Forest2.png';
const imgForest3 = new Image(); imgForest3.src = '../Resources/Tiles/Img_Forest3.png';
const imgForest4 = new Image(); imgForest4.src = '../Resources/Tiles/Img_Forest4.png';
const imgMilitia = new Image(); imgMilitia.src = '../Resources/NPCs/NPC_Peasant.png';
const imgGuard = new Image(); imgGuard.src = '../Resources/NPCs/NPC_Guard.png';
const imgMenAtArms = new Image(); imgMenAtArms.src = '../Resources/NPCs/NPC_ManAtArms.png';
const imgRanged = new Image(); imgRanged.src = '../Resources/NPCs/NPC_Ranged.png';
const imgKnight = new Image(); imgKnight.src = '../Resources/NPCs/NPC_Knight.png';
const imgCavalry = new Image(); imgCavalry.src = '../Resources/NPCs/NPC_Cavalry.png';
const imgKing = new Image(); imgKing.src = '../Resources/NPCs/NPC_King.png';
const imgWarMachine = new Image(); imgWarMachine.src = '../Resources/NPCs/NPC_Guard.png'; 
const imgArrow = new Image(); imgArrow.src = '../Resources/Arrow.png';

const ROLES = {
    MILITIA: { name: 'Militia', hp: 60, speed: 1.0, damage: 2, range: 15, img: imgMilitia, w: 7.5, h: 15 },
    GUARDS: { name: 'Guards', hp: 120, speed: 1.0, damage: 4, range: 15, img: imgGuard, w: 7.5, h: 15 },
    MEN_AT_ARMS: { name: 'Men-at-Arms', hp: 100, speed: 1.0, damage: 5, range: 15, img: imgMenAtArms, w: 7.5, h: 15 },
    RANGED: { name: 'Ranged', hp: 50, speed: 1.0, damage: 3, range: 120, img: imgRanged, w: 7.5, h: 15 },
    KNIGHT: { name: 'Knight', hp: 150, speed: 1.0, damage: 8, range: 18, img: imgKnight, w: 7.5, h: 15 },
    CAVALRY: { name: 'Cavalry', hp: 130, speed: 2.0, damage: 6, range: 20, img: imgCavalry, w: 30, h: 30 }, 
    WAR_MACHINE: { name: 'War-Machine', hp: 300, speed: 1.0, damage: 15, range: 150, img: imgWarMachine, w: 7.5, h: 15 },
    KING: { name: 'King', hp: 500, speed: 1.0, damage: 12, range: 20, img: imgKing, w: 7.5, h: 15 }
};

// --- IN-GAME POPUPS ---
function showGameMessage(text, callback) {
    let overlay = document.getElementById('custom-game-modal');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'custom-game-modal';
        overlay.style.position = 'fixed';
        overlay.style.top = '0'; overlay.style.left = '0';
        overlay.style.width = '100vw'; overlay.style.height = '100vh';
        overlay.style.backgroundColor = 'rgba(0,0,0,0.85)';
        overlay.style.display = 'flex';
        overlay.style.flexDirection = 'column';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.zIndex = '9999';

        let box = document.createElement('div');
        box.style.border = '4px solid #d4af37';
        box.style.background = 'linear-gradient(to top, #2b1d14, #0a0503)';
        box.style.padding = '40px'; box.style.borderRadius = '12px';
        box.style.textAlign = 'center'; box.style.boxShadow = '0 0 30px #8b0000';

        let msg = document.createElement('h2');
        msg.id = 'custom-game-modal-text';
        msg.style.color = '#d4af37'; msg.style.fontFamily = "'MedievalSharp', cursive";
        msg.style.fontSize = '2rem'; msg.style.marginBottom = '30px';
        msg.style.whiteSpace = 'pre-line'; 

        let btn = document.createElement('button');
        btn.innerText = 'Continue';
        btn.style.padding = '10px 30px'; btn.style.fontSize = '1.5rem';
        btn.style.fontFamily = "'MedievalSharp', cursive";
        btn.style.color = '#fff'; btn.style.background = '#8b0000';
        btn.style.border = '2px solid #ff3333'; btn.style.cursor = 'pointer';
        btn.style.borderRadius = '8px';

        btn.onclick = () => {
            overlay.style.display = 'none';
            if (overlay.callbackFunc) overlay.callbackFunc();
        };

        box.appendChild(msg); box.appendChild(btn); overlay.appendChild(box);
        document.body.appendChild(overlay);
    }
    document.getElementById('custom-game-modal-text').innerText = text;
    overlay.callbackFunc = callback;
    overlay.style.display = 'flex';
}

// --- CAMERA CONTROLS ---
let isDragging = false;
let lastMouse = { x: 0, y: 0 };

function resizeCanvas() {
    canvas.width = window.innerWidth;
    const topUI = document.getElementById('battle-ui') ? document.getElementById('battle-ui').offsetHeight : 0;
    const botUI = document.getElementById('ability-bar') ? document.getElementById('ability-bar').offsetHeight : 0;
    canvas.height = window.innerHeight - topUI - botUI;
    
    const scaleX = canvas.width / (MAP_SIZE * TILE_SIZE);
    const scaleY = canvas.height / (MAP_SIZE * TILE_SIZE);
    minZoom = Math.max(scaleX, scaleY);
    
    camera.zoom = minZoom;
    centerCamera();
}

// Kamera sa vycentruje presne na stred mapy, kde je tvoj kráľ
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
    const topUI = document.getElementById('battle-ui') ? document.getElementById('battle-ui').offsetHeight : 0;
    const mouseY = e.clientY - topUI;
    camera.x -= (mouseX - camera.x) * (camera.zoom / oldZoom - 1);
    camera.y -= (mouseY - camera.y) * (camera.zoom / oldZoom - 1);
    clampCamera();
}, { passive: false });

canvas.addEventListener('mousedown', (e) => { isDragging = true; lastMouse = { x: e.clientX, y: e.clientY }; });
window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    camera.x += e.clientX - lastMouse.x;
    camera.y += e.clientY - lastMouse.y;
    clampCamera();
    lastMouse = { x: e.clientX, y: e.clientY };
});
window.addEventListener('mouseup', () => isDragging = false);

canvas.addEventListener('click', (e) => {
    if (isTargetingExplosion) {
        const rect = canvas.getBoundingClientRect();
        const worldX = ((e.clientX - rect.left) / camera.zoom) - (camera.x / camera.zoom);
        const worldY = ((e.clientY - rect.top) / camera.zoom) - (camera.y / camera.zoom);
        executeExplosion(worldX, worldY, e.clientX, e.clientY);
        isTargetingExplosion = false;
        canvas.classList.remove('targeting-mode');
    }
});

function initBattle() {
    const modal = document.getElementById('army-setup-modal');
    if (modal) modal.style.display = 'block';
    generateBattleMap();
    resizeCanvas();
}

// --- MAP GENERATION ---
function generateBattleMap() {
    if (typeof noise !== 'undefined') noise.seed(Math.random());
    const NOISE_ZOOM = 0.1;
    const centerPoint = MAP_SIZE / 2;

    for (let y = 0; y < MAP_SIZE; y++) {
        mapData[y] = [];
        for (let x = 0; x < MAP_SIZE; x++) {
            let n = typeof noise !== 'undefined' ? (noise.perlin2(x * NOISE_ZOOM, y * NOISE_ZOOM) + 1) / 2 : 0.5;
            let tileImg = imgLand;
            let distanceToCenter = Math.sqrt(Math.pow(x - centerPoint, 2) + Math.pow(y - centerPoint, 2));

            // V strede urobíme čistinu pre tvoj hrad/kráľa, po okrajoch hustejšie lesy
            if (distanceToCenter > 8 && n < 0.6) {
                let chance = Math.random();
                if (chance < 0.20) tileImg = imgForest4;
                else if (chance < 0.40) tileImg = imgForest1;
                else if (chance < 0.60) tileImg = imgForest3;
                else tileImg = imgForest2;
            }
            mapData[y][x] = { img: tileImg };
        }
    }
    requestAnimationFrame(drawLoop);
}

// --- SPAWN ARMIES ---
function getRandomRole() {
    const roleKeys = Object.keys(ROLES).filter(k => k !== 'KING');
    const randomKey = roleKeys[Math.floor(Math.random() * roleKeys.length)];
    return ROLES[randomKey];
}

function createUnit(minX, maxX, minZ, maxZ, roleDef, isPlayer) {
    return {
        x: minX + Math.random() * (maxX - minX),
        y: minZ + Math.random() * (maxZ - minZ),
        role: roleDef.name,
        hp: roleDef.hp,
        maxHp: roleDef.hp,
        speed: roleDef.speed + (Math.random() * 0.1 - 0.05), 
        damage: roleDef.damage,
        range: roleDef.range,
        img: roleDef.img,
        w: roleDef.w, 
        h: roleDef.h, 
        cooldown: 0,
        target: null,
        isPlayerUnit: isPlayer
    };
}

function confirmDefenses() {
    const troopInput = document.getElementById('troop-input');
    if(!troopInput) return;

    let troopCount = parseInt(troopInput.value);
    if (isNaN(troopCount) || troopCount < 1) {
        showGameMessage("You must station at least 1 guard!", null);
        return;
    }
    if (troopCount > 400) troopCount = 400;
    
    document.getElementById('army-setup-modal').style.display = 'none';
    document.getElementById('army-count').innerText = "Your Army: " + troopCount;
    
    // Vypočítame celkový počet nepriateľov (Väčšia presila pre defense mód)
    totalEnemiesToSpawn = Math.floor(troopCount * 1.5) + Math.floor(Math.random() * 30);
    document.getElementById('enemy-count').innerText = "Enemies Remaining: " + totalEnemiesToSpawn;

    // Hráč sa spawnuje presne v strede mapy
    playerArmy = [];
    enemyArmy = [];
    projectiles = [];
    
    const centerPx = (MAP_SIZE * TILE_SIZE) / 2;
    const spawnRadius = TILE_SIZE * 3; 

    // Kráľ v úplnom strede
    playerArmy.push(createUnit(centerPx - 10, centerPx + 10, centerPx - 10, centerPx + 10, ROLES.KING, true));
    
    // Vojaci okolo kráľa
    for(let i = 1; i < troopCount; i++) {
        playerArmy.push(createUnit(centerPx - spawnRadius, centerPx + spawnRadius, centerPx - spawnRadius, centerPx + spawnRadius, getRandomRole(), true));
    }

    const clashBtn = document.getElementById('start-clash-btn');
    if(clashBtn) clashBtn.style.display = 'block';
}

// Funkcia, ktorá vytvára vlny z okrajov mapy
function spawnEnemyWave() {
    if (enemiesSpawnedSoFar >= totalEnemiesToSpawn || battleEnded) {
        clearInterval(waveInterval);
        return;
    }

    let enemiesInThisWave = Math.min(20, totalEnemiesToSpawn - enemiesSpawnedSoFar); // 20 vojakov vo vlne
    const mapWidthPx = MAP_SIZE * TILE_SIZE;

    for (let i = 0; i < enemiesInThisWave; i++) {
        let edge = Math.floor(Math.random() * 4); // 0 = Hore, 1 = Doprava, 2 = Dole, 3 = Doľava
        let minX, maxX, minY, maxY;

        if (edge === 0) { minX = 0; maxX = mapWidthPx; minY = -100; maxY = 0; }
        else if (edge === 1) { minX = mapWidthPx; maxX = mapWidthPx + 100; minY = 0; maxY = mapWidthPx; }
        else if (edge === 2) { minX = 0; maxX = mapWidthPx; minY = mapWidthPx; maxY = mapWidthPx + 100; }
        else { minX = -100; maxX = 0; minY = 0; maxY = mapWidthPx; }

        let newEnemy = createUnit(minX, maxX, minY, maxY, getRandomRole(), false);
        // Buff pre nepriateľov (ako vo field battle)
        newEnemy.maxHp = Math.floor(newEnemy.maxHp * 1.5);
        newEnemy.hp = newEnemy.maxHp;
        newEnemy.damage = newEnemy.damage * 1.2;
        
        enemyArmy.push(newEnemy);
        enemiesSpawnedSoFar++;
    }
}

function startWave() {
    const clashBtn = document.getElementById('start-clash-btn');
    if(clashBtn) clashBtn.style.display = 'none';
    isFighting = true;
    
    // Pustí hneď prvú vlnu a potom každých 8 sekúnd ďalšiu
    spawnEnemyWave();
    waveInterval = setInterval(spawnEnemyWave, 8000);
}

// --- INTELLIGENT TARGETING ---
function findBestTarget(unit, defenders) {
    let bestTarget = null;
    let minDist = Infinity;
    defenders.forEach(def => {
        let dist = Math.hypot(unit.x - def.x, unit.y - def.y);
        if (def.role === 'King' && unit.role !== 'War-Machine') dist += 10000; 
        if (dist < minDist) { minDist = dist; bestTarget = def; }
    });
    return bestTarget;
}

// --- COMBAT LOGIC ---
function updateCombat() {
    if (battleEnded) return;

    processArmyActions(playerArmy, enemyArmy);
    processArmyActions(enemyArmy, playerArmy);
    updateProjectiles();

    playerArmy = playerArmy.filter(u => u.hp > 0);
    enemyArmy = enemyArmy.filter(u => u.hp > 0);

    const isPlayerKingAlive = playerArmy.some(u => u.role === 'King');
    let enemiesRemaining = (totalEnemiesToSpawn - enemiesSpawnedSoFar) + enemyArmy.length;

    document.getElementById('army-count').innerText = "Your Army: " + playerArmy.length;
    document.getElementById('enemy-count').innerText = "Enemies Remaining: " + enemiesRemaining;

    if (!isPlayerKingAlive && playerArmy.length > 0) {
        battleEnded = true;
        isFighting = false;
        clearInterval(waveInterval);
        showGameMessage("Your King has fallen!\nThe defenses are broken.\n\nDEFEAT!", () => {
            window.location.href = "index.html"; // Návrat do menu
        });
        return;
    }

    if (enemiesRemaining === 0 && playerArmy.length > 0) {
        battleEnded = true;
        isFighting = false;
        clearInterval(waveInterval);
        showGameMessage("You successfully defended the Keep!\nThe enemy forces are routed.\n\nVICTORY!", () => {
            window.location.href = "index.html"; // Návrat do menu, alebo inej mapy
        });
    } else if (playerArmy.length === 0 && enemiesRemaining > 0) {
        battleEnded = true;
        isFighting = false;
        clearInterval(waveInterval);
        showGameMessage("Your army has been wiped out...\nThe Keep has fallen.\n\nDEFEAT!", () => {
            window.location.href = "index.html";
        });
    }
}

function processArmyActions(attackers, defenders) {
    if (defenders.length === 0) return;
    attackers.forEach(unit => {
        if (!unit.target || unit.target.hp <= 0 || Math.random() < 0.05) {
            unit.target = findBestTarget(unit, defenders);
        }
        let sepX = 0, sepY = 0;
        attackers.forEach(friend => {
            if (friend !== unit) {
                let dx = unit.x - friend.x;
                let dy = unit.y - friend.y;
                if (dx*dx + dy*dy < 225) { sepX += dx * 0.05; sepY += dy * 0.05; }
            }
        });
        if (unit.target) {
            let dist = Math.hypot(unit.target.x - unit.x, unit.target.y - unit.y);
            if (dist > unit.range) {
                let dx = unit.target.x - unit.x, dy = unit.target.y - unit.y;
                let length = Math.hypot(dx, dy);
                unit.x += (dx / length) * unit.speed + sepX;
                unit.y += (dy / length) * unit.speed + sepY;
            } else {
                if (unit.cooldown <= 0) {
                    let finalDamage = unit.damage * (0.8 + Math.random() * 0.4); 
                    if (Math.random() < 0.1) finalDamage *= 1.5;
                    if (unit.range > 20) {
                        projectiles.push({ x: unit.x, y: unit.y, target: unit.target, damage: finalDamage, speed: 3.5, isBoulder: unit.role === 'War-Machine' });
                    } else {
                        unit.target.hp -= finalDamage;
                    }
                    unit.cooldown = 80 + Math.random() * 40; 
                }
            }
        }
        if (unit.cooldown > 0) unit.cooldown--;
    });
}

function updateProjectiles() {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        let p = projectiles[i];
        if (p.target.hp <= 0) { projectiles.splice(i, 1); continue; }
        let dx = p.target.x - p.x, dy = p.target.y - p.y, dist = Math.hypot(dx, dy);
        if (dist < p.speed) {
            p.target.hp -= p.damage;
            projectiles.splice(i, 1);
        } else {
            p.x += (dx / dist) * p.speed;
            p.y += (dy / dist) * p.speed;
        }
    }
}

// --- ABILITIES LOGIC ---
function castExplosion() {
    if (!isFighting) { showGameMessage("Wait for the battle to start!", null); return; }
    isTargetingExplosion = true; canvas.classList.add('targeting-mode');
}

function executeExplosion(worldX, worldY, screenX, screenY) {
    const btn = document.getElementById('btn-explosion');
    if(btn) { btn.disabled = true; btn.innerText = "RECHARGING..."; }
    sfxExplosion.currentTime = 0; sfxExplosion.play();
    
    enemyArmy.forEach(enemy => {
        if (Math.hypot(enemy.x - worldX, enemy.y - worldY) <= 200) enemy.hp /= 2;
    });

    const fxContainer = document.getElementById('fx-container');
    if (fxContainer) {
        const explosionImg = document.createElement('img');
        explosionImg.src = '../Resources/Abilities/Explosion.gif?' + new Date().getTime();
        explosionImg.className = 'explosion-gif';
        explosionImg.style.left = screenX + 'px'; explosionImg.style.top = screenY + 'px';
        fxContainer.appendChild(explosionImg);
        setTimeout(() => { if (fxContainer.contains(explosionImg)) fxContainer.removeChild(explosionImg); }, 450);
    }
    setTimeout(() => { if(btn) { btn.disabled = false; btn.innerHTML = "💥 EXPLOSION"; } }, 5000);
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
            if (tile.img) ctx.drawImage(tile.img, x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE + 1, TILE_SIZE + 1);
        }
    }

    if (isFighting) updateCombat();

    function drawHP(unit, w, h, color) {
        const hpPercent = Math.max(unit.hp / unit.maxHp, 0);
        const barW = w > 20 ? w : w * 1.5, barH = 3;
        ctx.fillStyle = "#333"; ctx.fillRect(-barW / 2, -h / 2 - 6, barW, barH);
        ctx.fillStyle = color; ctx.fillRect(-barW / 2, -h / 2 - 6, barW * hpPercent, barH);
    }

    function drawUnit(unit, isEnemy) {
        ctx.save();
        let faceLeft = isEnemy; 
        if (unit.target) faceLeft = unit.target.x < unit.x;
        ctx.translate(unit.x, unit.y);
        if (faceLeft) ctx.scale(-1, 1); 
        if (isEnemy) ctx.filter = 'sepia(1) hue-rotate(-50deg) saturate(3)';
        ctx.drawImage(unit.img, -unit.w/2, -unit.h/2, unit.w, unit.h);
        if (faceLeft) ctx.scale(-1, 1); 
        drawHP(unit, unit.w, unit.h, isEnemy ? "#ff0000" : "#00ff00");
        ctx.restore();
    }

    playerArmy.forEach(unit => drawUnit(unit, false));
    enemyArmy.forEach(unit => drawUnit(unit, true));

    projectiles.forEach(p => {
        if (p.isBoulder) {
            ctx.fillStyle = "#555"; ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); ctx.fill();
        } else {
            let dx = p.target.x - p.x, dy = p.target.y - p.y;
            ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(Math.atan2(dy, dx)); ctx.imageSmoothingEnabled = false; 
            ctx.drawImage(imgArrow, -5, -2, 10, 4); ctx.restore(); 
        }
    });
    requestAnimationFrame(drawLoop);
}

function retreat() {
    showGameMessage("If you retreat now, the Keep will be lost!\nAre you sure?", () => { window.close(); });
}

window.onload = initBattle;