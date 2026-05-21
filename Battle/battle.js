const canvas = document.getElementById('battleCanvas');
const ctx = canvas.getContext('2d');
const sfxExplosion = new Audio('../Resources/SFX/SFX_Explosion.mp3');

// --- BATTLE VARIABLES ---
let battlePhase = "field";
let playerArmy = [];
let enemyArmy = [];
let projectiles = [];
let isFighting = false;
let isTargetingExplosion = false;

// --- CONSTANTS & ROLES ---
const MAP_SIZE = 25;
const TILE_SIZE = 128;
let mapData = [];
let camera = { x: 0, y: 0, zoom: 1 };
let minZoom = 1;

// --- IMAGES ---
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

// --- NOVÝ OBRÁZOK ŠÍPU ---
const imgArrow = new Image(); imgArrow.src = '../Resources/Arrow.png';

// Štatistiky (Rýchlosť je znížená 10-násobne pre pomalší boj)
const ROLES = {
    MILITIA: { name: 'Militia', hp: 60, speed: 1, damage: 2, range: 15, img: imgMilitia, w: 7.5, h: 15 },
    GUARDS: { name: 'Guards', hp: 120, speed: 1, damage: 4, range: 15, img: imgGuard, w: 7.5, h: 15 },
    MEN_AT_ARMS: { name: 'Men-at-Arms', hp: 100, speed: 1, damage: 5, range: 15, img: imgMenAtArms, w: 7.5, h: 15 },
    RANGED: { name: 'Ranged', hp: 50, speed: 1, damage: 3, range: 120, img: imgRanged, w: 7.5, h: 15 },
    KNIGHT: { name: 'Knight', hp: 150, speed: 1, damage: 8, range: 18, img: imgKnight, w: 7.5, h: 15 },
    CAVALRY: { name: 'Cavalry', hp: 130, speed: 2, damage: 6, range: 20, img: imgCavalry, w: 30, h: 30 }, 
    WAR_MACHINE: { name: 'War-Machine', hp: 300, speed: 1, damage: 15, range: 150, img: imgWarMachine, w: 7.5, h: 15 },
    KING: { name: 'King', hp: 500, speed: 1, damage: 12, range: 20, img: imgKing, w: 7.5, h: 15 }
};

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
    const topUI = document.getElementById('battle-ui') ? document.getElementById('battle-ui').offsetHeight : 0;
    const mouseY = e.clientY - topUI;
    
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

canvas.addEventListener('click', (e) => {
    if (isTargetingExplosion) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const worldX = (mouseX / camera.zoom) - (camera.x / camera.zoom);
        const worldY = (mouseY / camera.zoom) - (camera.y / camera.zoom);
        
        executeExplosion(worldX, worldY, e.clientX, e.clientY);
        
        isTargetingExplosion = false;
        canvas.classList.remove('targeting-mode');
    }
});

function initBattle() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('type')) {
        battlePhase = urlParams.get('type');
    }
    
    const phaseText = document.getElementById('phase-text');
    if (phaseText) phaseText.innerText = battlePhase.toUpperCase();
    
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
        speed: roleDef.speed + (Math.random() * 0.04 - 0.02), 
        damage: roleDef.damage,
        range: roleDef.range,
        img: roleDef.img,
        w: roleDef.w, 
        h: roleDef.h, 
        cooldown: 0,
        target: null 
    };
}

function spawnArmies(playerCount, enemyCount) {
    playerArmy = [];
    enemyArmy = [];
    projectiles = [];

    const minZ = TILE_SIZE * 4;
    const maxZ = TILE_SIZE * (MAP_SIZE - 4);
    const playerMinX = TILE_SIZE * 2;
    const playerMaxX = TILE_SIZE * 6;
    const enemyMinX = TILE_SIZE * (MAP_SIZE - 6);
    const enemyMaxX = TILE_SIZE * (MAP_SIZE - 2);

    playerArmy.push(createUnit(playerMinX, playerMaxX, minZ, maxZ, ROLES.KING));
    for(let i = 1; i < playerCount; i++) {
        playerArmy.push(createUnit(playerMinX, playerMaxX, minZ, maxZ, getRandomRole()));
    }

    enemyArmy.push(createUnit(enemyMinX, enemyMaxX, minZ, maxZ, ROLES.KING));
    for(let i = 1; i < enemyCount; i++) {
        enemyArmy.push(createUnit(enemyMinX, enemyMaxX, minZ, maxZ, getRandomRole()));
    }
}

// --- BATTLE UI LOGIC ---
function confirmArmy() {
    const troopInput = document.getElementById('troop-input');
    if(!troopInput) return;

    let troopCount = parseInt(troopInput.value);
    if (isNaN(troopCount) || troopCount < 1) {
        alert("You must send at least 1 soldier!");
        return;
    }
    
    if (troopCount > 400) {
        troopCount = 400;
        troopInput.value = 400;
    }
    
    document.getElementById('army-setup-modal').style.display = 'none';
    document.getElementById('army-count').innerText = "Your Army: " + troopCount;
    
    let enemyCount = troopCount + Math.floor(Math.random() * 20 - 10);
    if (enemyCount < 1) enemyCount = 1;
    if (enemyCount > 400) enemyCount = 400;
    document.getElementById('enemy-count').innerText = "Enemy: " + enemyCount;
    
    spawnArmies(troopCount, enemyCount);

    const clashBtn = document.getElementById('start-clash-btn');
    if(clashBtn) clashBtn.style.display = 'block';
}

function startClash() {
    const clashBtn = document.getElementById('start-clash-btn');
    if(clashBtn) clashBtn.style.display = 'none';
    isFighting = true;
}

// --- COMBAT LOGIC ---
function updateCombat() {
    processArmyActions(playerArmy, enemyArmy);
    processArmyActions(enemyArmy, playerArmy);
    updateProjectiles();

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

function findBestTarget(unit, defenders) {
    let bestTarget = null;
    let bestScore = -Infinity;

    defenders.forEach(def => {
        let distSq = (unit.x - def.x) ** 2 + (unit.y - def.y) ** 2;
        let dist = Math.sqrt(distSq);
        
        let score = -dist; 

        if (unit.role === 'Cavalry' && def.role === 'Ranged') score += 500; 
        if (unit.role === 'War-Machine' && (def.role === 'King' || def.role === 'Cavalry')) score += 800; 
        if (unit.role === 'Men-at-Arms' && def.role === 'Guards') score += 200; 

        if (score > bestScore) {
            bestScore = score;
            bestTarget = def;
        }
    });

    return bestTarget;
}

function processArmyActions(attackers, defenders) {
    if (defenders.length === 0) return;

    attackers.forEach(unit => {
        if (!unit.target || unit.target.hp <= 0) {
            unit.target = findBestTarget(unit, defenders);
        }

        let sepX = 0, sepY = 0;
        let neighbors = 0;
        attackers.forEach(friend => {
            if (friend !== unit) {
                let dx = unit.x - friend.x;
                let dy = unit.y - friend.y;
                let distSq = dx*dx + dy*dy;
                if (distSq < 225) { 
                    sepX += dx * 0.05;
                    sepY += dy * 0.05;
                    neighbors++;
                }
            }
        });

        if (unit.target) {
            let dist = Math.hypot(unit.target.x - unit.x, unit.target.y - unit.y);

            if (dist > unit.range) {
                let dx = unit.target.x - unit.x;
                let dy = unit.target.y - unit.y;
                let length = Math.hypot(dx, dy);
                
                unit.x += (dx / length) * unit.speed + sepX;
                unit.y += (dy / length) * unit.speed + sepY;
            } else {
                if (unit.cooldown <= 0) {
                    let damageMultiplier = 0.8 + (Math.random() * 0.4); 
                    let isCrit = Math.random() < 0.1;
                    if (isCrit) damageMultiplier *= 1.5;

                    let finalDamage = unit.damage * damageMultiplier;

                    if (unit.range > 20) {
                        projectiles.push({
                            x: unit.x,
                            y: unit.y,
                            target: unit.target,
                            damage: finalDamage,
                            speed: 1.5, // Znížená rýchlosť projektilov pre pomalší let
                            isBoulder: unit.role === 'War-Machine'
                        });
                    } else {
                        unit.target.hp -= finalDamage;
                    }
                    
                    unit.cooldown = 100 + Math.random() * 50; 
                }
            }
        }
        
        if (unit.cooldown > 0) unit.cooldown--;
    });
}

function updateProjectiles() {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        let p = projectiles[i];
        
        if (p.target.hp <= 0) {
            projectiles.splice(i, 1);
            continue;
        }

        let dx = p.target.x - p.x;
        let dy = p.target.y - p.y;
        let dist = Math.hypot(dx, dy);

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
    if (!isFighting) {
        alert("Wait for the battle to start!");
        return;
    }
    isTargetingExplosion = true;
    canvas.classList.add('targeting-mode');
}

function executeExplosion(worldX, worldY, screenX, screenY) {
    const btn = document.getElementById('btn-explosion');
    if(btn) {
        btn.disabled = true;
        btn.innerText = "RECHARGING...";
    }

    sfxExplosion.currentTime = 0; 
    sfxExplosion.play();
    
    const explosionRadius = 200;
    enemyArmy.forEach(enemy => {
        let dist = Math.hypot(enemy.x - worldX, enemy.y - worldY);
        if (dist <= explosionRadius) {
            enemy.hp /= 2;
        }
    });

    const fxContainer = document.getElementById('fx-container');
    if (fxContainer) {
        const explosionImg = document.createElement('img');
        explosionImg.src = '../Resources/Abilities/Explosion.gif?' + new Date().getTime();
        explosionImg.className = 'explosion-gif';
        explosionImg.style.left = screenX + 'px';
        explosionImg.style.top = screenY + 'px';
        
        fxContainer.appendChild(explosionImg);
        
        setTimeout(() => {
            if (fxContainer.contains(explosionImg)) {
                fxContainer.removeChild(explosionImg);
            }
        }, 450);
    }

    setTimeout(() => {
        if(btn) {
            btn.disabled = false;
            btn.innerHTML = "💥 EXPLOSION";
        }
    }, 5000);
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

    function drawHP(unit, w, h, color) {
        const hpPercent = Math.max(unit.hp / unit.maxHp, 0);
        const barW = w > 20 ? w : w * 1.5; 
        const barH = 3;
        const barX = unit.x - barW / 2;
        const barY = unit.y - h / 2 - 6;

        ctx.fillStyle = "#333";
        ctx.fillRect(barX, barY, barW, barH);
        ctx.fillStyle = color;
        ctx.fillRect(barX, barY, barW * hpPercent, barH);
    }

    playerArmy.forEach(unit => {
        ctx.drawImage(unit.img, unit.x - unit.w/2, unit.y - unit.h/2, unit.w, unit.h);
        drawHP(unit, unit.w, unit.h, "#00ff00");
    });

    enemyArmy.forEach(unit => {
        ctx.save();
        ctx.filter = 'sepia(1) hue-rotate(-50deg) saturate(3)';
        ctx.drawImage(unit.img, unit.x - unit.w/2, unit.y - unit.h/2, unit.w, unit.h);
        ctx.restore();
        drawHP(unit, unit.w, unit.h, "#ff0000");
    });

    // --- LOGIKA VYKRESLOVANIA PROJEKTILOV (UPRAVENÁ PRE OBRÁZOK) ---
    projectiles.forEach(p => {
        if (p.isBoulder) {
            // Kamene (boulders) necháme ako sivé krúžky, kým nebude nakreslený šuter
            ctx.fillStyle = "#555";
            ctx.beginPath();
            ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Šípy (arrows) - použijeme imgArrow a otočíme ho k cieľu
            
            // Vypočítame uhol letu na základe pohybu k cieľu
            let dx = p.target.x - p.x;
            let dy = p.target.y - p.y;
            let angle = Math.atan2(dy, dx);

            // Nastavíme pevnú vizuálnu veľkosť pre šíp na mape (napr. 10x4 pixelov)
            let arrowWidth = 10;
            let arrowHeight = 4;

            ctx.save(); // Uložíme aktuálny stav canvasu
            ctx.translate(p.x, p.y); // Posunieme stred kreslenia na pozíciu šípu
            ctx.rotate(angle); // Otočíme canvas o uhol letu
            ctx.imageSmoothingEnabled = false; // Udržíme pixel-art ostrý

            // Vykreslíme obrázok vycentrovaný na bod p.x, p.y
            ctx.drawImage(imgArrow, -arrowWidth / 2, -arrowHeight / 2, arrowWidth, arrowHeight);
            
            ctx.restore(); // Vrátime stav canvasu späť
        }
    });

    requestAnimationFrame(drawLoop);
}

function retreat() {
    if(confirm("Are you sure you want to retreat? You will lose honor and troops!")) {
        window.close();
    }
}

window.onload = () => {
    initBattle();
};