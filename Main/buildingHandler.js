let isBuildingMode = false;
let selectedBuildingImg = null;
let selectedBuildingSrc = null; 
let maxBuildLevel = null;
let currentBuildingPrice = 0;
let currentBuildingPopCost = 0;
let currentBuildingCategory = null; 

// Suroviny
let currentGold = 100000;
let currentPop = 100000;
let currentWood = 50000;
let currentStone = 200000;
let currentFood = 1000000;

let selectedTileForInfo = null;

function toggleStats(menuId) {
    const menu = document.getElementById(menuId);
    menu.style.display = (menu.style.display === "none") ? "flex" : "none";
}

function updateHUD() {
    const statGoldDisplay = document.getElementById('stat-gold');
    const statWoodDisplay = document.getElementById('stat-wood');
    const statStoneDisplay = document.getElementById('stat-stone');
    const statPopDisplay = document.getElementById('stat-pop');
    const statFoodDisplay = document.getElementById('stat-food');
    const statDaysDisplay = document.getElementById('stat-days');

    if (statGoldDisplay) statGoldDisplay.innerText = currentGold;
    if (statWoodDisplay) statWoodDisplay.innerText = currentWood;
    if (statStoneDisplay) statStoneDisplay.innerText = currentStone;
    if (statPopDisplay) statPopDisplay.innerText = currentPop;
    if (statFoodDisplay) statFoodDisplay.innerText = currentFood;

    if (statDaysDisplay) {
        statDaysDisplay.innerText = currentPop > 0 ? Math.floor(currentFood / currentPop) : "∞";
    }
}

function showWarning(msg, type) {
    let warningDiv = document.getElementById('game-warning') || document.createElement('div');
    warningDiv.id = 'game-warning';
    if (!document.getElementById('game-warning')) document.body.appendChild(warningDiv);
    
    warningDiv.style.cssText = "position:absolute; top:15%; left:50%; transform:translateX(-50%); font-family:'MedievalSharp', cursive; font-size:2rem; text-shadow:2px 2px 5px #000; pointer-events:none; opacity:1; transition:opacity 0.3s ease; z-index:1000;";
    
    if (type === "red") {
        warningDiv.style.color = "#ff4500";
    } else if (type === "yellow") {
        warningDiv.style.color = "#ffd700";
    } else {
        warningDiv.style.color = "#ffffff"; 
    }
    
    warningDiv.innerText = msg;
    
    clearTimeout(warningDiv.timeoutId);
    warningDiv.timeoutId = setTimeout(() => { 
        warningDiv.style.opacity = '0'; 
    }, 2000);
}

function startBattle() {
    showWarning("Your army is not ready yet, my Lord!", "red");
}

function startBuilding(imageSrc, maxLVL, price, popCost, category) {
    if (currentGold < price || currentPop < popCost) {
        showWarning("Not enough resources or population!", "red");
        return;
    }

    isBuildingMode = true;
    selectedBuildingImg = new Image();
    selectedBuildingImg.src = imageSrc;
    selectedBuildingSrc = imageSrc;
    maxBuildLevel = maxLVL;
    currentBuildingPrice = price;
    currentBuildingPopCost = popCost;
    currentBuildingCategory = category; 
    
    document.getElementById('gameCanvas').style.cursor = "crosshair";
}

document.getElementById('gameCanvas').addEventListener('click', (e) => {
    const canvas = e.target;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const worldX = (mouseX - camera.x) / camera.zoom;
    const worldY = (mouseY - camera.y) / camera.zoom;

    const gridX = Math.floor(worldX / TILE_SIZE);
    const gridY = Math.floor(worldY / TILE_SIZE);

    if (gridX >= 0 && gridX < MAP_SIZE && gridY >= 0 && gridY < MAP_SIZE) {
        const tile = mapData[gridY][gridX];
        
        // --- NOVÉ: Otvorenie info okna po kliknutí na postavenú budovu ---
        if (!isBuildingMode) {
            if (tile.buildingImg) {
                openBuildingInfo(tile, gridX, gridY);
            }
            return;
        }
        // -----------------------------------------------------------------

        const isWaterOrForest = tile.img && (tile.img.src.includes('Water') || tile.img.src.includes('Forest'));
        const isHillOrMountain = tile.img && (tile.img.src.includes('Hills') || tile.img.src.includes('Mountains'));

        if (isWaterOrForest) {
            showWarning("You cannot build here!", "red");
            finalizeBuild(canvas);
            return;
        }

        if (selectedBuildingImg && !tile.buildingImg) {
            if (currentBuildingCategory === 'mines' && !isHillOrMountain) {
                showWarning("Mines can only be built on hills!", "red");
                finalizeBuild(canvas); return;
            } else if (currentBuildingCategory !== 'mines' && isHillOrMountain) {
                showWarning("Only mines can be built here!", "red");
                finalizeBuild(canvas); return;
            }
        }

        if (tile.buildingImg) {
            if (currentGold < currentBuildingPrice || currentPop < currentBuildingPopCost) {
                showWarning("Not enough resources for upgrade!", "red");
                finalizeBuild(canvas); return;
            }
            if (tile.buildingLevel >= maxBuildLevel) {
                showWarning("Maximum level reached!", "red");
                finalizeBuild(canvas); return; 
            }

            tile.buildingLevel = (tile.buildingLevel || 1) + 1;
            tile.buildingSrc = tile.buildingSrc.replace(/(\d+)(?=\.\w+$)/, tile.buildingLevel);
            const newImg = new Image();
            newImg.src = tile.buildingSrc;
            tile.buildingImg = newImg;
            
            currentGold -= currentBuildingPrice;
            updateHUD();
            finalizeBuild(canvas); return; 
        }

        if (selectedBuildingImg) {
            if (currentGold < currentBuildingPrice || currentPop < currentBuildingPopCost) {
                showWarning("Not enough resources!", "red");
                finalizeBuild(canvas); return;
            }

            tile.buildingImg = selectedBuildingImg;
            tile.buildingSrc = selectedBuildingSrc; 
            tile.buildingLevel = 1; 
            
            currentGold -= currentBuildingPrice;
            updateHUD();
            finalizeBuild(canvas);
        }
    }
});

function finalizeBuild(canvas) {
    isBuildingMode = false;
    selectedBuildingImg = null;
    selectedBuildingSrc = null;
    currentBuildingPrice = 0;
    currentBuildingPopCost = 0;
    currentBuildingCategory = null; 
    canvas.style.cursor = "default";
}

// --- NOVÉ FUNKCIE PRE INFO OKNO BUDOVY ---
function openBuildingInfo(tile, x, y) {
    selectedTileForInfo = { tile, x, y };
    
    const modal = document.getElementById('building-info-modal');
    const nameEl = document.getElementById('info-name');
    const imgEl = document.getElementById('info-img');
    const descEl = document.getElementById('info-desc');
    const levelEl = document.getElementById('info-level');

    // Nájdeme základný obrázok (level 1), aby sme v JSONe našli dáta o budove
    let baseSrc = tile.buildingSrc;
    if (tile.buildingLevel > 1) {
         baseSrc = tile.buildingSrc.replace(/(\d+)(?=\.\w+$)/, '1');
    }

    let bData = window.gameBuildings ? window.gameBuildings.find(b => b.image === baseSrc) : null;

    nameEl.innerText = bData ? bData.name : "Unknown Structure";
    descEl.innerText = bData ? bData.description : "No records found in the chronicles.";
    imgEl.src = tile.buildingSrc; 
    levelEl.innerText = tile.buildingLevel || 1;

    modal.style.display = 'flex';
}

function closeBuildingInfo() {
    document.getElementById('building-info-modal').style.display = 'none';
    selectedTileForInfo = null;
}

function sellBuilding() {
    if (!selectedTileForInfo) return;
    
    // Odstráni budovu z mapy
    selectedTileForInfo.tile.buildingImg = null;
    selectedTileForInfo.tile.buildingSrc = null;
    selectedTileForInfo.tile.buildingLevel = null;
    
    currentGold += 25; // Pridá 25 zlatiek za predaj
    updateHUD();
    
    closeBuildingInfo();
    showWarning("Building sold!" , "yellow");
}
// -----------------------------------------

function saveGame() {
    const realmName = sessionStorage.getItem('game_realmName') || "Unknown Realm";
    let buildingsToSave = [];
    for (let y = 0; y < MAP_SIZE; y++) {
        for (let x = 0; x < MAP_SIZE; x++) {
            if (mapData[y] && mapData[y][x] && mapData[y][x].buildingImg) {
                buildingsToSave.push({
                    x: x, y: y,
                    src: mapData[y][x].buildingSrc,
                    level: mapData[y][x].buildingLevel
                });
            }
        }
    }

    const saveData = {
        realmName: realmName,
        seed: sessionStorage.getItem('game_seed'),
        gold: currentGold, pop: currentPop,
        wood: currentWood, stone: currentStone, food: currentFood,
        buildings: buildingsToSave,
        timestamp: new Date().toLocaleString()
    };

    let allSaves = JSON.parse(localStorage.getItem('taverns_saves') || '{}');
    allSaves[realmName] = saveData; 
    localStorage.setItem('taverns_saves', JSON.stringify(allSaves));
}

setInterval(saveGame, 15000);

window.addEventListener('DOMContentLoaded', () => {
    const realmDisplay = document.getElementById('realm-display');
    const savedRealmName = sessionStorage.getItem('game_realmName');
    if (savedRealmName && realmDisplay) realmDisplay.innerText = savedRealmName;

    currentGold = parseInt(sessionStorage.getItem('game_gold')) || parseInt(sessionStorage.getItem('game_startingWealth')) || currentGold;
    currentPop = parseInt(sessionStorage.getItem('game_pop')) || currentPop;
    currentWood = parseInt(sessionStorage.getItem('game_wood')) || currentWood;
    currentStone = parseInt(sessionStorage.getItem('game_stone')) || currentStone;
    currentFood = parseInt(sessionStorage.getItem('game_food')) || currentFood;
    
    updateHUD();
});