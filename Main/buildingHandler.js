// Suroviny
let currentGold = 100000;
let currentPop = 1000000;
let currentWood = 1000000;
let currentStone = 1000000;
let currentFood = 5000000; // Nová surovina

// Funkcia na rozbaľovanie menu (nová)
function toggleStats(menuId) {
    const menu = document.getElementById(menuId);
    if (menu.style.display === "none") {
        menu.style.display = "flex";
    } else {
        menu.style.display = "none";
    }
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

    // Výpočet jedla: 1 obyvateľ zje 1 jedlo za deň
    if (statDaysDisplay) {
        let daysLeft = currentPop > 0 ? Math.floor(currentFood / currentPop) : "∞";
        statDaysDisplay.innerText = daysLeft;
    }
}

// In-game Warning ak je nedostatok resources
function showWarning(msg) {
    let warningDiv = document.getElementById('game-warning');
    if (!warningDiv) {
        warningDiv = document.createElement('div');
        warningDiv.id = 'game-warning';
        document.body.appendChild(warningDiv);
        warningDiv.style.cssText = "position:absolute; top:15%; left:50%; transform:translateX(-50%); color:#ff4500; font-family:'MedievalSharp', cursive; font-size:2rem; text-shadow:2px 2px 5px #000; pointer-events:none; opacity:0; transition:opacity 0.3s ease; z-index:1000;";
    }
    warningDiv.innerText = msg;
    warningDiv.style.opacity = '1';
    clearTimeout(warningDiv.timeoutId);
    warningDiv.timeoutId = setTimeout(() => { warningDiv.style.opacity = '0'; }, 2000);
}

function startBuilding(imageSrc, maxLVL, price, popCost) {
    if (currentGold < price || currentPop < popCost) {
        showWarning("Not enough resources or population!");
        return;
    }

    isBuildingMode = true;
    selectedBuildingImg = new Image();
    selectedBuildingImg.src = imageSrc;
    maxBuildLevel = maxLVL;
    currentBuildingPrice = price;
    currentBuildingPopCost = popCost;
    
    document.getElementById('gameCanvas').style.cursor = "crosshair";
}

document.getElementById('gameCanvas').addEventListener('click', (e) => {
    if (!isBuildingMode) return;

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

        // --- KONTROLA: Zákaz stavať na vode a v lese ---
        if (tile.img && (tile.img.src.includes('Water') || tile.img.src.includes('Forest'))) {
            showWarning("You cannot build here!");
            finalizeBuild(canvas);
            return;
        }
        // -----------------------------------------------

        if (tile.buildingImg) {
            if (currentGold < currentBuildingPrice || currentPop < currentBuildingPopCost) {
                showWarning("Not enough resources for upgrade!");
                finalizeBuild(canvas);
                return;
            }

            if (tile.buildingLevel >= maxBuildLevel) {
                showWarning("Maximum level reached!");
                finalizeBuild(canvas);
                return; 
            }

            tile.buildingLevel = (tile.buildingLevel || 1) + 1;
            const newImg = new Image();
            newImg.src = tile.buildingImg.src.replace(/(\d+)(?=\.\w+$)/, tile.buildingLevel);
            tile.buildingImg = newImg;
            
            currentGold -= currentBuildingPrice;
            updateHUD();
            
            finalizeBuild(canvas);
            return; 
        }

        if (selectedBuildingImg) {
            if (currentGold < currentBuildingPrice || currentPop < currentBuildingPopCost) {
                showWarning("Not enough resources!");
                finalizeBuild(canvas);
                return;
            }

            tile.buildingImg = selectedBuildingImg;
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
    currentBuildingPrice = 0;
    currentBuildingPopCost = 0;
    canvas.style.cursor = "default";
}

window.addEventListener('DOMContentLoaded', () => {
    const realmDisplay = document.getElementById('realm-display');
    const savedRealmName = sessionStorage.getItem('game_realmName');
    
    if (savedRealmName && realmDisplay) {
        realmDisplay.innerText = savedRealmName;
    }

    currentGold = parseInt(sessionStorage.getItem('game_startingWealth')) || currentGold; 
    updateHUD();
});