//Pomocne premenne
let isBuildingMode = false;
let selectedBuildingImg = null;
let selectedBuildingSrc = null; 
let maxBuildLevel = null;
let currentBuildingPrice = 0;
let currentBuildingPopCost = 0;
let currentBuildingCategory = null; 

//Suroviny
let currentGold = 100000;
let currentPop = 0;
let currentWood = 50000;
let currentStone = 200000;
let currentFood = 1000000;
let currentLevel = 1;
let currentXP = 0;

let selectedTileForInfo = null;

//Workplaces pre NPCs
var activeFields = [];
var activeMines = [];
var activeLumberyards = [];
var activeQuarries = [];
var activeBarracks = [];

//Zapnutie bocnych menu
function toggleStats(menuId) {
    const menu = document.getElementById(menuId);
    menu.style.display = (menu.style.display === "none") ? "flex" : "none";
}

//Updatovanie hracskeho rozhrania pri zmene surovin, populacie a podobneho
function updateHUD() {
    const statGoldDisplay = document.getElementById('stat-gold');
    const statWoodDisplay = document.getElementById('stat-wood');
    const statStoneDisplay = document.getElementById('stat-stone');
    const statPopDisplay = document.getElementById('stat-pop');
    const statFoodDisplay = document.getElementById('stat-food');
    const statLevelDisplay = document.getElementById('stat-level');
    const statXPDisplay = document.getElementById('stat-xp');
    const statDaysDisplay = document.getElementById('stat-days');

    if (statGoldDisplay) statGoldDisplay.innerText = currentGold;
    if (statWoodDisplay) statWoodDisplay.innerText = currentWood;
    if (statStoneDisplay) statStoneDisplay.innerText = currentStone;
    if (statPopDisplay) statPopDisplay.innerText = currentPop;
    if (statFoodDisplay) statFoodDisplay.innerText = currentFood;
    if (currentXP >= currentLevel * 100) {
        currentXP -= currentLevel * 100;
        currentLevel += 1;
        showWarning(`Level up! You are now level ${currentLevel}.`, "yellow");
    }
    if (statLevelDisplay) statLevelDisplay.innerText = currentLevel;
    if (statXPDisplay) statXPDisplay.innerText = currentXP + "/" + (currentLevel * 100);

    if (statDaysDisplay) {
        statDaysDisplay.innerText = currentPop > 0 ? Math.floor(currentFood / currentPop) : "inf";
    }
}

//Zobrazovanie upozorneni
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

//TODO: battle mode
function startBattle() {
    document.getElementById('battle-menu-modal').style.display = 'flex';
}

function closeBattleMenu() {
    document.getElementById('battle-menu-modal').style.display = 'none';
}

function selectBattleType(type) {
    console.log("Hráč si vybral bitku typu: " + type);
}



//Stavanie budov
function startBuilding(imageSrc, maxLVL, price, popCost, category, levelReq) {
    //Ak nemame dostatok zlata alebo populacie, zobrazime upozornenie a nebudeme pokracovat do rezimu stavania
    if (currentGold < price) {
        showWarning("Not enough gold!", "red");
        return;
    }

    if (currentLevel < levelReq) {
        showWarning("Not enough level!", "red");
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

//Kontrolovaneie inputu od hraca (stavanie, zobrovanie info okna, tazenie lesa...)
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

        //TODO: Pridat maximalnu vzdialenost od lumberyardu pre tazenie lesa, aby sa nedalo tazit les na druhom konci mapy
        // Logika na tazenie lesa
        if (!isBuildingMode && tile.img && tile.img.src.includes('Forest') && (activeLumberyards.length > 0)) {
            if (tile.isClearing) return;

            const lumberedLand = new Image();
            lumberedLand.src = '../Resources/Tiles/Img_Forest4.png'; // Obrázok rúbaniska

            tile.img = lumberedLand;
            tile.isClearing = true;
            tile.clearStartTime = Date.now();
            tile.clearDuration = 10000;

            const chopSound = new Audio('../Resources/SFX/SFX_ChoppingWood.mp3');
            chopSound.loop = true; 
            chopSound.volume = 0.4; 
            chopSound.play();
            
            tile.clearingSound = chopSound;

            showWarning("Clearing forest...", "yellow");
            return;
        }
        
        if (!isBuildingMode) {
        if (tile.buildingImg) {
            if (tile.buildingSrc && tile.buildingSrc.toLowerCase().includes('tavern')) {
                openTavernModal();
                return;
            }
            openBuildingInfo(tile, gridX, gridY);
        }
        return;
    }

        //Kontrola typu terenu a zobrazovanie upozorneni ak nie je splnena podmienka pre stavbu
        const isWaterOrForest = tile.img && (tile.img.src.includes('Water') || tile.img.src.includes('Forest'));
        const isHillOrMountain = tile.img && (tile.img.src.includes('Hills') || tile.img.src.includes('Mountains'));

        if (isWaterOrForest) {
            showWarning("You cannot build here!", "red");
            finalizeBuild(canvas);
            return;
        }

        //Povolenie stavby iba pre Mine
        if (selectedBuildingImg && !tile.buildingImg) {
            if (selectedBuildingImg.src.includes('Mine') && !isHillOrMountain) {
                showWarning("Mines can only be built on hills!", "red");
                finalizeBuild(canvas); return;
            } else if (!selectedBuildingImg.src.includes('Mine') && isHillOrMountain) {
                showWarning("Only mines can be built here!", "red");
                finalizeBuild(canvas); return;
            }
        }
        
        //TODO: Pridat to aby sa nedala upgradovat budova aj inou budovou
        //upgrade logika budov
        if (tile.buildingImg) {
            if (currentGold < currentBuildingPrice) {
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

            if (selectedBuildingImg.src.includes('Cabin') || selectedBuildingImg.src.includes('House')) 
            {
                console.log(`Built ${selectedBuildingSrc} at (${gridX}, ${gridY})`);
                if (shouldSpawnNPC(selectedBuildingSrc)) {
                    createNPC(gridX, gridY);
                    currentPop += 1;
                    updateHUD();
                }
                console.log(`Total NPCs: ${activeNPCs.length}`);
                activeNPCs.forEach(element => {
                    console.log(`NPC ${element.name} lives at (${element.homeX}, ${element.homeY}) with profession ${element.profession}.`);
                });
            }
            
            currentGold -= currentBuildingPrice;
            updateHUD();
            finalizeBuild(canvas);
            return; 
        }

        if (selectedBuildingImg) {
            if (currentGold < currentBuildingPrice) {
                showWarning("Not enough resources!", "red");
                finalizeBuild(canvas); return;
            }

            tile.buildingImg = selectedBuildingImg;
            tile.buildingSrc = selectedBuildingSrc; 
            tile.buildingLevel = 1; 
            
            currentGold -= currentBuildingPrice;
            updateHUD();


            //Pridanie pracovnych miest pre NPCs
            if (selectedBuildingImg.src.includes('Farmland')) { //Farmy
                activeFields.push(gridX + "," + gridY);
                console.log("New field added at (" + gridX + ", " + gridY + ")");
                
                console.log("Current active fields:");
                activeFields.forEach(element => {
                    console.log(element);
                });
            }
            else if (selectedBuildingImg.src.includes('Lumberyard')) {  //Lumberyardy
                activeLumberyards.push(gridX + "," + gridY);
                console.log("New lumberyard added at (" + gridX + ", " + gridY + ")");

                console.log("Current active lumberyards:");
                activeLumberyards.forEach(element => {
                    console.log(element);
                });
            }
            else if (selectedBuildingImg.src.includes('Mine')) {  //Mines
                activeMines.push(gridX + "," + gridY);
                console.log("New mine added at (" + gridX + ", " + gridY + ")");

                console.log("Current active mines:");
                activeMines.forEach(element => {
                    console.log(element);
                });
            }
            else if (selectedBuildingImg.src.includes('Barracks')) {  //Barracks
                activeBarracks.push(gridX + "," + gridY);
                console.log("New barracks added at (" + gridX + ", " + gridY + ")");

                console.log("Current active barracks:");
                activeBarracks.forEach(element => {
                    console.log(element);
                });
            }

            //Generovanie NPC pri postaveni budovy
            if (selectedBuildingImg.src.includes('Cabin') || selectedBuildingImg.src.includes('House')) 
            {
                console.log(`Built ${selectedBuildingSrc} at (${gridX}, ${gridY})`);
                if (selectedBuildingImg.src.includes('StoneHouse')) {
                    createNPC(gridX, gridY);
                    createNPC(gridX, gridY);
                    currentPop += 2;
                    updateHUD();
                }
                else if (selectedBuildingImg.src.includes('LargeLogCabin'))
                {
                    createNPC(gridX, gridY);
                    createNPC(gridX, gridY);
                    createNPC(gridX, gridY);
                    createNPC(gridX, gridY);
                    currentPop += 4;
                    updateHUD();
                }
                else if (selectedBuildingImg.src.includes('TownHouse'))
                {
                    createNPC(gridX, gridY);
                    createNPC(gridX, gridY);
                    createNPC(gridX, gridY);
                    createNPC(gridX, gridY);
                    createNPC(gridX, gridY);
                    createNPC(gridX, gridY);
                    currentPop += 6;
                    updateHUD();
                }
                else 
                {
                    createNPC(gridX, gridY);
                    currentPop += 1;
                    updateHUD();
                }
                console.log(`Total NPCs: ${activeNPCs.length}`);
                activeNPCs.forEach(element => {
                    console.log(`NPC ${element.name} lives at (${element.homeX}, ${element.homeY}) with profession ${element.profession}.`);
                });
            }
            finalizeBuild(canvas);
        }
    }
});

//Vypnutie rezimu stavania a resetovanie pomocnych premennych
function finalizeBuild(canvas) {
    currentXP += 5;
    isBuildingMode = false;
    selectedBuildingImg = null;
    selectedBuildingSrc = null;
    currentBuildingPrice = 0;
    currentBuildingPopCost = 0;
    currentBuildingCategory = null; 
    canvas.style.cursor = "default";
}

function openBuildingInfo(tile, x, y) {
    selectedTileForInfo = { tile, x, y };
    
    const modal = document.getElementById('building-info-modal');
    const nameEl = document.getElementById('info-name');
    const imgEl = document.getElementById('info-img');
    const descEl = document.getElementById('info-desc');
    const levelEl = document.getElementById('info-level');
    const healthEl = document.getElementById('info-health');
    const prodEl = document.getElementById('info-production');

    let baseSrc = tile.buildingSrc;
    if (tile.buildingLevel > 1) {
         baseSrc = tile.buildingSrc.replace(/(\d+)(?=\.\w+$)/, '1');
    }

    let bData = window.gameBuildings ? window.gameBuildings.find(b => b.image === baseSrc) : null;

    nameEl.innerText = bData ? bData.name : "Unknown Structure";
    descEl.innerText = bData ? bData.description : "No records found in the chronicles.";
    imgEl.src = tile.buildingSrc; 
    
    let currentLevel = tile.buildingLevel || 1;
    levelEl.innerText = currentLevel;

    let maxHealth = bData && bData.baseHealth ? bData.baseHealth * currentLevel : 100 * currentLevel;
    healthEl.innerText = `${maxHealth} / ${maxHealth}`;
    
    prodEl.innerText = bData && bData.productionText ? bData.productionText : "None";

    modal.style.display = 'flex';
}

function closeBuildingInfo() {
    document.getElementById('building-info-modal').style.display = 'none';
    selectedTileForInfo = null;
}

//TODO: Vytvorit logiku pre upgrade button
function upgradeBuilding() {
    showWarning("Upgrade functionality is not implemented yet!", "yellow");
}

function sellBuilding() {
    if (!selectedTileForInfo) return;
    //TODO: OPRAVIT TOTO aby sa spravne pocitalo zlato pri predaji budovy
    currentGold += selectedTileForInfo.tile.buildingLevel * selectedTileForInfo.tile.buildingPrice * 0.75 || 0;

    selectedTileForInfo.tile.buildingImg = null;
    selectedTileForInfo.tile.buildingSrc = null;
    selectedTileForInfo.tile.buildingLevel = null;
    
    updateHUD();
    
    closeBuildingInfo();
    showWarning("Building sold!" , "yellow");
}

function openTavernModal() {
    document.getElementById('tavern-modal').style.display = 'flex';
}

function closeTavernModal() {
    document.getElementById('tavern-modal').style.display = 'none';
}

//
//BEKEHO ROBOTA-------------------------------------------------------------------------------
//
//TODO: Vytvorit logiku ukladania a nacitavania hry
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

let resources = {
    gold: 0,
    wood: 0,
    stone: 0,
    food: 0,
    coal: 0
};

function processProduction() {
    if (typeof activeBuildings === 'undefined') return;

    activeBuildings.forEach(building => {
        const type = (building.src || building.type || building.name || "").toLowerCase();
        if (type.includes('mine') || type.includes('bana')) {
            resources.stone += 2;
            resources.coal += 100;
        } else if (type.includes('lumber') || type.includes('sawmill') || type.includes('wood')) {
            resources.wood += 3;
        } else if (type.includes('farm') || type.includes('field') || type.includes('pole')) {
            resources.food += 5;
        } 
    });

    updateResourceUI();
}

function updateResourceUI() {
    const uiMap = {
        'stat-gold': resources.gold,
        'stat-wood': resources.wood,
        'stat-stone': resources.stone,
        'stat-food': resources.food,
        'stat-coal': resources.coal
    };

    for (const [id, value] of Object.entries(uiMap)) {
        const el = document.getElementById(id);
        if (el) el.innerText = value;
    }
}

// 10 000 milisekúnd = 10 sekúnd
setInterval(processProduction, 10000);

// Spustí produkciu surovín každých 5 sekúnd (5000 ms)
setInterval(processProduction, 5000);

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