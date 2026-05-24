// Pomocne premenne
let isBuildingMode = false;
let selectedBuildingImg = null;
let selectedBuildingSrc = null; 
let maxBuildLevel = null;
let currentBuildingPrice = 0;
let currentBuildingPopCost = 0;
let currentBuildingCategory = null; 

// Suroviny
let currentGold = 100000;
let currentPop = 0;
let currentWood = 0;
let currentStone = 0;
let currentCoal = 0;
let currentIron = 0;
let currentSteel = 0;
let currentPlanks = 0;
let currentFood = 100;
let currentLevel = 1;
let currentXP = 0;
let currentTrainingPoints = 0;

let selectedTileForInfo = null;
let isChopping = false;

// Workplaces pre NPCs
var activeFields = [];
var activeMines = [];
var activeLumberyards = [];
var activeQuarries = [];
var activeBarracks = [];

let coinSFX = new Audio();
coinSFX.src = "../Resources/SFX/SFX_Coins.mp3";
coinSFX.volume = 0.3;

// Zapnutie bocnych menu
function toggleStats(menuId) {
    const menu = document.getElementById(menuId);
    menu.style.display = (menu.style.display === "none") ? "flex" : "none";
}

// Updatovanie hracskeho rozhrania pri zmene surovin, populacie a podobneho
function updateHUD() {
    const statGoldDisplay = document.getElementById('stat-gold');
    const statWoodDisplay = document.getElementById('stat-wood');
    const statStoneDisplay = document.getElementById('stat-stone');
    const statPopDisplay = document.getElementById('stat-pop');
    const statFoodDisplay = document.getElementById('stat-food');
    const statLevelDisplay = document.getElementById('stat-level');
    const statXPDisplay = document.getElementById('stat-xp');
    const statDaysDisplay = document.getElementById('stat-days');
    const statCoalDisplay = document.getElementById('stat-coal');
    const statIronDisplay = document.getElementById('stat-iron');
    const statSteelDisplay = document.getElementById('stat-steel')
    const statTPDisplay = document.getElementById('stat-tp');

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
    if (statCoalDisplay) statCoalDisplay.innerText = currentCoal;
    if (statIronDisplay) statIronDisplay.innerText = currentIron;
    if (statSteelDisplay) statSteelDisplay.innerText = currentSteel;
    if (statTPDisplay) statTPDisplay.innerText = currentTrainingPoints;

    /*if (statDaysDisplay) {
        statDaysDisplay.innerText = currentPop > 0 ? Math.floor(currentFood / currentPop) : "inf";
    }*/
}

// Zobrazovanie upozorneni
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

// TODO: battle mode
function startBattle() {
    document.getElementById('battle-menu-modal').style.display = 'flex';
}

function closeBattleMenu() {
    document.getElementById('battle-menu-modal').style.display = 'none';
}

function selectBattleType(type) {
    console.log("Hráč si vybral bitku typu: " + type);
}

// Stavanie budov
function startBuilding(imageSrc, maxLVL, price, popCost, category, levelReq) {
    // Ak nemame dostatok zlata alebo populacie, zobrazime upozornenie a nebudeme pokracovat do rezimu stavania
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

// Kontrolovaneie inputu od hraca (stavanie, zobrovanie info okna, tazenie lesa...)
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

        // TODO: Pridat maximalnu vzdialenost od lumberyardu pre tazenie lesa, aby sa nedalo tazit les na druhom konci mapy
        // Logika na tazenie lesa
        if (!isBuildingMode && tile.img && tile.img.src.includes('Forest') && (activeLumberyards.length > 0) && isChopping == false) {
            if (tile.isClearing) return;

            isChopping = true;
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

        // Kontrola typu terenu a zobrazovanie upozorneni ak nie je splnena podmienka pre stavbu
        const isWaterOrForest = tile.img && (tile.img.src.includes('Water') || tile.img.src.includes('Forest'));
        const isHillOrMountain = tile.img && (tile.img.src.includes('Hills') || tile.img.src.includes('Mountains'));

        if (isWaterOrForest) {
            showWarning("You cannot build here!", "red");
            finalizeBuild(canvas);
            return;
        }

        // Povolenie stavby iba pre Mine
        if (selectedBuildingImg && !tile.buildingImg) {
            if (selectedBuildingImg.src.includes('Mine') && !isHillOrMountain) {
                showWarning("Mines can only be built on hills!", "red");
                finalizeBuild(canvas); 
                return;
            } else if (!selectedBuildingImg.src.includes('Mine') && isHillOrMountain) {
                showWarning("Only mines can be built here!", "red");
                finalizeBuild(canvas); 
                return;
            }
        }

        // TODO: Pridat to aby sa nedala upgradovat budova aj inou budovou
        // upgrade logika budov
        if (tile.buildingImg) {
            if (currentGold < currentBuildingPrice) {
                showWarning("Not enough resources for upgrade!", "red");
                finalizeBuild(canvas); 
                return;
            }
            if (tile.buildingLevel >= maxBuildLevel) {
                showWarning("Maximum level reached!", "red");
                finalizeBuild(canvas); 
                return; 
            }

            tile.buildingLevel = (tile.buildingLevel || 1) + 1;
            tile.buildingSrc = tile.buildingSrc.replace(/(\d+)(?=\.\w+$)/, tile.buildingLevel);
            const newImg = new Image();
            newImg.src = tile.buildingSrc;
            tile.buildingImg = newImg;

            if (selectedBuildingImg.src.includes('Cabin') || selectedBuildingImg.src.includes('House')) {
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
            spawnFloatingText(("-" + currentBuildingPrice + " Gold"), gridX, gridY, "#cc0000");
            coinSFX.play();
            updateHUD();
            finalizeBuild(canvas);
            return; 
        }

        if (selectedBuildingImg) {
            if (currentGold < currentBuildingPrice) {
                showWarning("Not enough resources!", "red");
                finalizeBuild(canvas); 
                return;
            }

            tile.buildingImg = selectedBuildingImg;
            tile.buildingSrc = selectedBuildingSrc; 
            tile.buildingLevel = 1; 

            currentGold -= currentBuildingPrice;
            spawnFloatingText(("-" + currentBuildingPrice + " Gold"), gridX, gridY, "#cc0000");
            coinSFX.play();
            updateHUD();

            // Pridanie pracovnych miest pre NPCs
            if (selectedBuildingImg.src.includes('Farmland')) { // Farmy
                activeFields.push(gridX + "," + gridY);
                console.log("New field added at (" + gridX + ", " + gridY + ")");
                console.log("Current active fields:");
                activeFields.forEach(element => {
                    console.log(element);
                });
            } else if (selectedBuildingImg.src.includes('Lumberyard')) { // Lumberyardy
                activeLumberyards.push(gridX + "," + gridY);
                console.log("New lumberyard added at (" + gridX + ", " + gridY + ")");
                console.log("Current active lumberyards:");
                activeLumberyards.forEach(element => {
                    console.log(element);
                });
            } else if (selectedBuildingImg.src.includes('Mine')) { // Mines
                activeMines.push(gridX + "," + gridY);
                console.log("New mine added at (" + gridX + ", " + gridY + ")");
                console.log("Current active mines:");
                activeMines.forEach(element => {
                    console.log(element);
                });
            } else if (selectedBuildingImg.src.includes('Barracks')) { // Barracks
                activeBarracks.push(gridX + "," + gridY);
                console.log("New barracks added at (" + gridX + ", " + gridY + ")");
                console.log("Current active barracks:");
                activeBarracks.forEach(element => {
                    console.log(element);
                });
            }

            // Generovanie NPC pri postaveni budovy
            if (selectedBuildingImg.src.includes('Cabin') || selectedBuildingImg.src.includes('House')) {
                console.log(`Built ${selectedBuildingSrc} at (${gridX}, ${gridY})`);
                if (selectedBuildingImg.src.includes('StoneHouse')) {
                    createNPC(gridX, gridY);
                    createNPC(gridX, gridY);
                    currentPop += 2;
                    updateHUD();
                } else if (selectedBuildingImg.src.includes('LargeLogCabin')) {
                    createNPC(gridX, gridY);
                    createNPC(gridX, gridY);
                    createNPC(gridX, gridY);
                    createNPC(gridX, gridY);
                    currentPop += 4;
                    updateHUD();
                } else if (selectedBuildingImg.src.includes('TownHouse')) {
                    createNPC(gridX, gridY);
                    createNPC(gridX, gridY);
                    createNPC(gridX, gridY);
                    createNPC(gridX, gridY);
                    createNPC(gridX, gridY);
                    createNPC(gridX, gridY);
                    currentPop += 6;
                    updateHUD();
                } else {
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

// Vypnutie rezimu stavania a resetovanie pomocnych premennych
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

// TODO: Vytvorit logiku pre upgrade button
function upgradeBuilding() {
    showWarning("Upgrade functionality is not implemented yet!", "yellow");
}

function sellBuilding() {
    if (!selectedTileForInfo) return;

    coinSFX.play();

    const soldX = selectedTileForInfo.x;
    const soldY = selectedTileForInfo.y;
    const coordString = `${soldX},${soldY}`;
    const tile = selectedTileForInfo.tile;

    // 1. VÝPOČTU ZLATA: Keďže tile nemá .buildingPrice, musíme cenu vytiahnuť z kroniky (window.gameBuildings)
    let baseSrc = tile.buildingSrc;
    if (tile.buildingLevel > 1) {
        baseSrc = tile.buildingSrc.replace(/(\d+)(?=\.\w+$)/, '1');
    }
    let bData = window.gameBuildings ? window.gameBuildings.find(b => b.image === baseSrc) : null;
    let basePrice = bData ? bData.price : 100; // Ak nenájde cenu, dáme predvolenú 100

    // Pripočítame zlato (75% z ceny budovy vynásobenej jej levelom)
    let goldRefund = Math.floor((tile.buildingLevel || 1) * basePrice * 0.75);
    currentGold += goldRefund;
    spawnFloatingText((`+${goldRefund} Gold`), soldX, soldY, "#00cc00");

    // 2. ODSTRÁNENIE Z HERNÝCH POCOV: Vymažeme súradnice zo všetkých polí pracovísk
    activeFields = activeFields.filter(c => c !== coordString);
    activeLumberyards = activeLumberyards.filter(c => c !== coordString);
    activeMines = activeMines.filter(c => c !== coordString);
    activeBarracks = activeBarracks.filter(c => c !== coordString);
    activeQuarries = activeQuarries.filter(c => c !== coordString); // Pridané lomy, ktoré máš v kóde

    // 3. PRESMEROVANIE NPC: Skontrolujeme, či nejaké NPC nestratilo domov alebo prácu
    if (typeof activeNPCs !== 'undefined' && Array.isArray(activeNPCs)) {
        activeNPCs.forEach(npc => {
            // Stratil domov?
            if (npc.homeX === soldX && npc.homeY === soldY) {
                relocateNPCHomeAfterSell(npc, soldX, soldY);
            }
            // Stratil prácu?
            if (npc.workplaceX === soldX && npc.workplaceY === soldY) {
                relocateNPCWorkplaceAfterSell(npc);
            }
        });
    }

    // 4. VYČISTENIE DLAŽDICE
    tile.buildingImg = null;
    tile.buildingSrc = null;
    tile.buildingLevel = null;

    updateHUD();
    closeBuildingInfo();
    showWarning("Building sold!", "yellow");
}


//Taverna a minihry

function openTavernModal() {
    document.getElementById('tavern-modal').style.display = 'flex';
}

function closeTavernModal() {
    document.getElementById('tavern-modal').style.display = 'none';
}

const marketPrices = {
    wood:   { name: "Wood",   buy: 10,  sell: 5 },
    stone:  { name: "Stone",  buy: 15,  sell: 7 },
    coal:   { name: "Coal",   buy: 25,  sell: 12 },
    iron:   { name: "Iron",   buy: 40,  sell: 20 },
    steel:  { name: "Steel",  buy: 80,  sell: 40 },
    planks: { name: "Planks", buy: 20,  sell: 10 },
    food:   { name: "Food",   buy: 8,   sell: 4 }
};

// Pomocná funkcia na získanie a nastavenie hodnôt globálnych premenných dynamicky
function getResourceValue(key) {
    if (key === 'wood') return currentWood;
    if (key === 'stone') return currentStone;
    if (key === 'coal') return currentCoal;
    if (key === 'iron') return currentIron;
    if (key === 'steel') return currentSteel;
    if (key === 'planks') return currentPlanks;
    if (key === 'food') return currentFood;
    return 0;
}

function changeResourceValue(key, amount) {
    if (key === 'wood') currentWood += amount;
    if (key === 'stone') currentStone += amount;
    if (key === 'coal') currentCoal += amount;
    if (key === 'iron') currentIron += amount;
    if (key === 'steel') currentSteel += amount;
    if (key === 'planks') currentPlanks += amount;
    if (key === 'food') currentFood += amount;
}

// === NÁKUPNÝ MODAL (Browse Goods) ===
function browseGoods() {
    // Schováme hlavné menu krčmy a otvoríme nákup
    document.getElementById('tavern-modal').style.display = 'none';
    document.getElementById('buy-market-modal').style.display = 'flex';
    renderBuyMarket();
}

function closeBuyModal() {
    document.getElementById('buy-market-modal').style.display = 'none';
    document.getElementById('tavern-modal').style.display = 'flex'; // Návrat do krčmy
}

function renderBuyMarket() {
    const container = document.getElementById('buy-goods-list');
    container.innerHTML = ""; // Vyčistiť starý obsah

    // Prejdeme všetky suroviny v objekte marketPrices
    for (const [key, resource] of Object.entries(marketPrices)) {
        const row = document.createElement('div');
        row.style.cssText = "display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #5c3a21; font-size: 1.2rem;";
        
        row.innerHTML = `
            <div style="flex: 1;"><strong>${resource.name}</strong></div>
            <div style="flex: 1; color: #ffd700;">Price: ${resource.buy} G</div>
            <div style="flex: 1; text-align: right;">
                <button onclick="buyResource('${key}', 1)" style="background: #8B4513; color: white; border: 1px solid #ffd700; padding: 5px 10px; cursor: pointer; margin-right: 5px;">+1</button>
                <button onclick="buyResource('${key}', 10)" style="background: #8B4513; color: white; border: 1px solid #ffd700; padding: 5px 10px; cursor: pointer;">+10</button>
            </div>
        `;
        container.appendChild(row);
    }
}

function buyResource(key, amount) {
    const cost = marketPrices[key].buy * amount;

    if (currentGold < cost) {
        showWarning("Not enough gold to buy this!", "red");
        return;
    }

    // Odpočítanie zlata a pripočítanie suroviny
    currentGold -= cost;
    changeResourceValue(key, amount);

    // Efekty a HUD
    if (coinSFX) coinSFX.play();
    showWarning(`Bought ${amount}x ${marketPrices[key].name}`, "yellow");
    updateHUD();
    renderBuyMarket(); // Prekreslíme okno (ak by sme v budúcnosti chceli zobrazovať napr. sklad)
}


function sellGoods() {
    // Schováme hlavné menu krčmy a otvoríme predaj
    document.getElementById('tavern-modal').style.display = 'none';
    document.getElementById('sell-market-modal').style.display = 'flex';
    renderSellMarket();
}

function closeSellModal() {
    document.getElementById('sell-market-modal').style.display = 'none';
    document.getElementById('tavern-modal').style.display = 'flex'; // Návrat do krčmy
}

function renderSellMarket() {
    const container = document.getElementById('sell-goods-list');
    container.innerHTML = "";

    for (const [key, resource] of Object.entries(marketPrices)) {
        const currentAmount = getResourceValue(key);
        const row = document.createElement('div');
        row.style.cssText = "display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #5c3a21; font-size: 1.2rem;";
        
        row.innerHTML = `
            <div style="flex: 1;"><strong>${resource.name}</strong> <span style="color: #aaa; font-size: 0.9rem;">(Own: ${currentAmount})</span></div>
            <div style="flex: 1; color: #00cc00;">Value: ${resource.sell} G</div>
            <div style="flex: 1; text-align: right;">
                <button onclick="sellResource('${key}', 1)" style="background: #8B4513; color: white; border: 1px solid #ffd700; padding: 5px 10px; cursor: pointer; margin-right: 5px;" ${currentAmount < 1 ? 'disabled style="opacity:0.5;"' : ''}>-1</button>
                <button onclick="sellResource('${key}', 10)" style="background: #8B4513; color: white; border: 1px solid #ffd700; padding: 5px 10px; cursor: pointer;" ${currentAmount < 10 ? 'disabled style="opacity:0.5;"' : ''}>-10</button>
            </div>
        `;
        container.appendChild(row);
    }
}

function sellResource(key, amount) {
    const currentAmount = getResourceValue(key);

    if (currentAmount < amount) {
        showWarning("You don't have enough resources to sell!", "red");
        return;
    }

    const earnings = marketPrices[key].sell * amount;

    // Odpočítanie suroviny a pripočítanie zlata
    changeResourceValue(key, -amount);
    currentGold += earnings;

    // Efekty a HUD
    if (coinSFX) coinSFX.play();
    showWarning(`Sold ${amount}x ${marketPrices[key].name} for ${earnings} G`, "yellow");
    updateHUD();
    renderSellMarket(); // Prekreslíme zoznam, aby sa aktualizovali počty (Own: X) a vypli neklikatľné tlačidlá
}