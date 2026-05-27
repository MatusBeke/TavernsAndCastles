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
let battleEnded = false;
let maxAvailableTroops = 0; // Nová premenná pre tvoj reálny počet NPC

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
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100vw';
        overlay.style.height = '100vh';
        overlay.style.backgroundColor = 'rgba(0,0,0,0.85)';
        overlay.style.display = 'flex';
        overlay.style.flexDirection = 'column';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.zIndex = '9999';

        let box = document.createElement('div');
        box.style.border = '4px solid #d4af37';
        box.style.background = 'linear-gradient(to top, #2b1d14, #0a0503)';
        box.style.padding = '40px';
        box.style.borderRadius = '12px';
        box.style.textAlign = 'center';
        box.style.boxShadow = '0 0 30px #8b0000';

        let msg = document.createElement('h2');
        msg.id = 'custom-game-modal-text';
        msg.style.color = '#d4af37';
        msg.style.fontFamily = "'MedievalSharp', cursive";
        msg.style.fontSize = '2rem';
        msg.style.marginBottom = '30px';
        msg.style.whiteSpace = 'pre-line'; 

        let btn = document.createElement('button');
        btn.innerText = 'Continue';
        btn.style.padding = '10px 30px';
        btn.style.fontSize = '1.5rem';
        btn.style.fontFamily = "'MedievalSharp', cursive";
        btn.style.color = '#fff';
        btn.style.background = '#8b0000';
        btn.style.border = '2px solid #ff3333';
        btn.style.cursor = 'pointer';
        btn.style.borderRadius = '8px';

        btn.onclick = () => {
            overlay.style.display = 'none';
            if (overlay.callbackFunc) overlay.callbackFunc();
        };

        box.appendChild(msg);
        box.appendChild(btn);
        overlay.appendChild(box);
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
    
    // Načítanie max počtu vojakov z URL
    if (urlParams.has('maxTroops')) {
        maxAvailableTroops = parseInt(urlParams.get('maxTroops')) || 0;
    }
    
    const phaseText = document.getElementById('phase-text');
    if (phaseText) phaseText.innerText = battlePhase.toUpperCase();
    
    // Úprava inputu podľa tvojej mapy
    const troopInput = document.getElementById('troop-input');
    if (troopInput) {
        troopInput.max = maxAvailableTroops;
        troopInput.value = maxAvailableTroops > 0 ? maxAvailableTroops : 0;
        
        // Zabezpečenie: Ak hráč manuálne napíše väčšie číslo, hneď ho to opraví
        troopInput.addEventListener('input', function() {
            if (parseInt(this.value) > maxAvailableTroops) {
                this.value = maxAvailableTroops;
            }
        });
        
        const modalText = document.querySelector('#army-setup-modal p');
        if (modalText) {
            modalText.innerText = `You have ${maxAvailableTroops} citizens in your realm ready to fight.\nHow many will you deploy?`;
        }

        // Prepísanie textu "Available: 400" na reálnu hodnotu
        const availableText = document.getElementById('available-text');
        if (availableText) {
            availableText.innerText = "Available: " + maxAvailableTroops;
        }
    }
    
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

function spawnArmies(playerCount, enemyCount) {
    playerArmy = [];
    enemyArmy = [];
    projectiles = [];

    const minZ = TILE_SIZE * 4;
    const maxZ = TILE_SIZE * (MAP_SIZE - 4);
    
    const playerMinX = TILE_SIZE * 3;
    const playerMaxX = TILE_SIZE * 7;
    const enemyMinX = TILE_SIZE * (MAP_SIZE - 7);
    const enemyMaxX = TILE_SIZE * (MAP_SIZE - 3);

    playerArmy.push(createUnit(TILE_SIZE * 1, TILE_SIZE * 2, minZ, maxZ, ROLES.KING, true));
    for(let i = 1; i < playerCount; i++) {
        playerArmy.push(createUnit(playerMinX, playerMaxX, minZ, maxZ, getRandomRole(), true));
    }

    enemyArmy.push(createUnit(TILE_SIZE * (MAP_SIZE - 2), TILE_SIZE * (MAP_SIZE - 1), minZ, maxZ, ROLES.KING, false));
    for(let i = 1; i < enemyCount; i++) {
        enemyArmy.push(createUnit(enemyMinX, enemyMaxX, minZ, maxZ, getRandomRole(), false));
    }

    // --- BUFF PRE NEPRIATEĽOV (+50% HP, +20% Damage) ---
    enemyArmy.forEach(unit => {
        unit.maxHp = Math.floor(unit.maxHp * 1.5);
        unit.hp = unit.maxHp;
        unit.damage = unit.damage * 1.2;
    });
}

// --- BATTLE UI LOGIC ---
function confirmArmy() {
    const troopInput = document.getElementById('troop-input');
    if(!troopInput) return;

    let troopCount = parseInt(troopInput.value);
    
    if (maxAvailableTroops === 0) {
        showGameMessage("You have no citizens to send to battle!", null);
        return;
    }
    
    if (isNaN(troopCount) || troopCount < 1) {
        showGameMessage("You must send at least 1 soldier!", null);
        return;
    }
    
    // Kontrola voči max počtu
    if (troopCount > maxAvailableTroops) {
        troopCount = maxAvailableTroops;
        troopInput.value = maxAvailableTroops;
        showGameMessage(`You only have ${maxAvailableTroops} citizens!`, null);
        return;
    }
    
    document.getElementById('army-setup-modal').style.display = 'none';
    document.getElementById('army-count').innerText = "Your Army: " + troopCount;
    
    let enemyCount = troopCount + Math.floor(Math.random() * (troopCount * 0.2)); // Nepriateľ má max o 20% viac
    if (enemyCount < 1) enemyCount = 1;
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

// --- INTELLIGENT TARGETING ---
function findBestTarget(unit, defenders) {
    let bestTarget = null;
    let minDist = Infinity;

    defenders.forEach(def => {
        let dist = Math.hypot(unit.x - def.x, unit.y - def.y);
        
        if (dist < minDist) {
            minDist = dist;
            bestTarget = def;
        }
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

    let eventMessage = "";

    const isEnemyKingAlive = enemyArmy.some(u => u.role === 'King');
    const isPlayerKingAlive = playerArmy.some(u => u.role === 'King');

    if (!isEnemyKingAlive && enemyArmy.length > 0) {
        enemyArmy.forEach(u => { u.isPlayerUnit = true; playerArmy.push(u); });
        enemyArmy = [];
        eventMessage = "The Enemy King has fallen!\nTheir remaining army surrenders and joins you.";
    }
    else if (!isPlayerKingAlive && playerArmy.length > 0) {
        playerArmy.forEach(u => { u.isPlayerUnit = false; enemyArmy.push(u); });
        playerArmy = [];
        eventMessage = "Your King has fallen!\nYour army surrenders to the enemy.";
    }

    if (playerArmy.length > 0 && enemyArmy.length > 0) {
        if (enemyArmy.length < 30 && playerArmy.length >= enemyArmy.length + 20) {
            enemyArmy.forEach(u => { u.isPlayerUnit = true; playerArmy.push(u); });
            enemyArmy = [];
            eventMessage = "The enemy army's morale broke!\nThey drop their weapons and surrender.";
        } 
        else if (playerArmy.length < 30 && enemyArmy.length >= playerArmy.length + 20) {
            playerArmy.forEach(u => { u.isPlayerUnit = false; enemyArmy.push(u); });
            playerArmy = [];
            eventMessage = "Your army's morale broke under overwhelming odds!\nThey surrender.";
        }
    }

    document.getElementById('army-count').innerText = "Your Army: " + playerArmy.length;
    document.getElementById('enemy-count').innerText = "Enemy: " + enemyArmy.length;

    if (enemyArmy.length === 0 && playerArmy.length > 0) {
        battleEnded = true;
        isFighting = false;
        setTimeout(() => {
            showGameMessage(eventMessage ? eventMessage + "\n\nVICTORY!\nReturning to your world." : "VICTORY!\nReturning to your world.", () => {
                window.location.href = "../Main/index.html"; 
            });
        }, 1500);
    } else if (playerArmy.length === 0 && enemyArmy.length > 0) {
        battleEnded = true;
        isFighting = false;
        setTimeout(() => {
            showGameMessage(eventMessage ? eventMessage + "\n\nDEFEAT!\nThey are marching to your world!" : "DEFEAT!\nThey are marching to your world!", () => {
                window.location.href = "../Main/index.html?underAttack=true"; 
            });
        }, 1500);
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
                let distSq = dx*dx + dy*dy;
                if (distSq < 225) { 
                    sepX += dx * 0.05;
                    sepY += dy * 0.05;
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
                            speed: 3.5,
                            isBoulder: unit.role === 'War-Machine'
                        });
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
        showGameMessage("Wait for the battle to start!", null);
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
        const barX = -barW / 2; 
        const barY = -h / 2 - 6;

        ctx.fillStyle = "#333";
        ctx.fillRect(barX, barY, barW, barH);
        ctx.fillStyle = color;
        ctx.fillRect(barX, barY, barW * hpPercent, barH);
    }

    function drawUnit(unit, isEnemy) {
        ctx.save();
        
        let faceLeft = isEnemy; 
        if (unit.target) {
            faceLeft = unit.target.x < unit.x;
        }

        ctx.translate(unit.x, unit.y);
        
        if (faceLeft) {
            ctx.scale(-1, 1); 
        }

        if (isEnemy) {
            ctx.filter = 'sepia(1) hue-rotate(-50deg) saturate(3)';
        }

        ctx.drawImage(unit.img, -unit.w/2, -unit.h/2, unit.w, unit.h);
        
        if (faceLeft) ctx.scale(-1, 1); 
        
        drawHP(unit, unit.w, unit.h, isEnemy ? "#ff0000" : "#00ff00");
        ctx.restore();
    }

    playerArmy.forEach(unit => drawUnit(unit, false));
    enemyArmy.forEach(unit => drawUnit(unit, true));

    projectiles.forEach(p => {
        if (p.isBoulder) {
            ctx.fillStyle = "#555";
            ctx.beginPath();
            ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
            ctx.fill();
        } else {
            let dx = p.target.x - p.x;
            let dy = p.target.y - p.y;
            let angle = Math.atan2(dy, dx);
            let arrowWidth = 10;
            let arrowHeight = 4;

            ctx.save(); 
            ctx.translate(p.x, p.y); 
            ctx.rotate(angle); 
            ctx.imageSmoothingEnabled = false; 
            ctx.drawImage(imgArrow, -arrowWidth / 2, -arrowHeight / 2, arrowWidth, arrowHeight);
            ctx.restore(); 
        }
    });

    requestAnimationFrame(drawLoop);
}

function retreat() {
    showGameMessage("Are you sure you want to retreat?\nYou will lose honor and troops!", () => {
        window.close();
    });
}

window.onload = () => {
    initBattle();
};