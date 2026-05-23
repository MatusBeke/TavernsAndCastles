// Generovanie mapy za pouzitia Perlin Noise a pohyb kamery pomocou mysky
var MAP_SIZE = 200;
var TILE_SIZE = 128;
var mapData = []; 
var camera = { x: 0, y: 0, zoom: 1 };

let floatingTexts = [];

function spawnFloatingText(text, tileX, tileY, color = "#d9ff00", duration = 1500) {
    // Calculate the pixel center of the target tile
    const pixelX = tileX * TILE_SIZE + TILE_SIZE / 2;
    const pixelY = tileY * TILE_SIZE + TILE_SIZE / 2;

    floatingTexts.push({
        text: text,
        x: pixelX,
        y: pixelY,
        color: color,
        startTime: Date.now(),
        duration: duration
    });
}

function drawFloatingTexts(ctx) {
    const now = Date.now();
    
    ctx.save();
    ctx.font = "bold 16px MedievalSharp";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const ft = floatingTexts[i];
        const elapsed = now - ft.startTime;

        if (elapsed > ft.duration) {
            floatingTexts.splice(i, 1);
            continue;
        }

        const progress = elapsed / ft.duration;


        const currentY = ft.y - (progress * 40);  
        const alpha = progress < 0.5 ? 1 : 1 - ((progress - 0.5) / 0.5);

        ctx.fillStyle = ft.color;
        ctx.globalAlpha = alpha;
        ctx.fillText(ft.text, ft.x, currentY);

        ctx.globalAlpha = 1;
    }

    ctx.restore();
}


    // Pripojenie na HTML canvas pre vykreslovanie
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    // Premenne pre tahanie mapy mysou
    let isDragging = false;
    let lastMouse = { x: 0, y: 0 };

    let lastTime = performance.now();

    // Parametre generovania mapy cez noise
    let waterLevel = 0.4;
    let landLevel = 0.75;
    let mountainLevel = 1;
    // Biomy
    let forestLevel = 0.55;
    let hillsLevel = 0.8;

    // Nacitavanie zakladnych obrazkov
    const imgWater = new Image(); imgWater.src = '../Resources/Tiles/Img_WaterDefault.gif';
    const imgLand = new Image(); imgLand.src = '../Resources/Tiles/Img_LandDefault.png';
    const imgMountains = new Image(); imgMountains.src = '../Resources/Tiles/Img_Mountains.png';

    // Nacitavanie obrazkov pre les
    const imgForest1 = new Image(); imgForest1.src = '../Resources/Tiles/Img_Forest1.png';
    const imgForest2 = new Image(); imgForest2.src = '../Resources/Tiles/Img_Forest2.png';
    const imgForest3 = new Image(); imgForest3.src = '../Resources/Tiles/Img_Forest3.png';
    const imgForest4 = new Image(); imgForest4.src = '../Resources/Tiles/Img_Forest4.png';
    const imgHills = new Image(); imgHills.src = '../Resources/Tiles/Img_Hills.png';

    // Funkcia ktora vygeneruje celu mapu pri starte
    function initMap() {
        noise.seed(Math.random()); // Nahodny seed pre jedinecnu mapu kazdu hru
        const NOISE_ZOOM = 0.08;
        const forestImages = [imgForest1, imgForest2, imgForest3, imgForest4];

        // Prejdenie celej mriezky mapy (y, x)
        for (let y = 0; y < MAP_SIZE; y++) {
            mapData[y] = [];
            for (let x = 0; x < MAP_SIZE; x++) {
                // Vypocet vysky terenu od 0 do 1
                let n = (noise.perlin2(x * NOISE_ZOOM, y * NOISE_ZOOM) + 1) / 2;
                let tileImg;
                
                // Rozhodovanie o tom, aky blok sa tu vygeneruje podla vysky
                if (n < waterLevel) {
                    tileImg = imgWater; // Voda
                } else if (n < landLevel) {
                    if (n < forestLevel) {
                        // Generovanie nahodneho druhu stromu v lese
                        let chance = Math.random();
                        if (chance < 0.05) {
                            tileImg = imgForest4; 
                        } else if (chance < 0.20) {
                            tileImg = imgForest1; 
                        } else if (chance < 0.30) {
                            tileImg = imgForest3; 
                        } else {
                            tileImg = imgForest2; 
                        }
                    } else {
                        tileImg = imgLand; // Cista trava
                    }
                } else {
                    tileImg = (n < hillsLevel) ? imgHills : imgMountains; // Kopce a hory
                }

                //Save logika mapy
                let tileType = 'land';
                if (tileImg === imgWater) tileType = 'water';
                else if (tileImg === imgMountains) tileType = 'mountains';
                else if (tileImg === imgHills) tileType = 'hills';
                else if (tileImg === imgForest1) tileType = 'forest1';
                else if (tileImg === imgForest2) tileType = 'forest2';
                else if (tileImg === imgForest3) tileType = 'forest3';
                else if (tileImg === imgForest4) tileType = 'forest4';
                
                // Ulozenie bloku do pamate mapy
                mapData[y][x] = { n: n, img: tileImg, type: tileType };
            }
        }

        // Nahodne spawnovanie 3 uvodnych taverien na cistej trave
        let tavernsSpawned = 0;
        while (tavernsSpawned < 3) {
            let rx = Math.floor(Math.random() * MAP_SIZE);
            let ry = Math.floor(Math.random() * MAP_SIZE);
            let tile = mapData[ry][rx];

            // Ak sme trafili travu a nie je tam ina budova
            if (tile.img === imgLand && !tile.buildingImg) {
                const tavernImg = new Image();
                tavernImg.src = '../Resources/Img_Tavern.png';
                
                tile.buildingImg = tavernImg;
                tile.buildingSrc = tavernImg.src;
                tile.buildingLevel = 1;
                
                tavernsSpawned++;
            }
        }

        // Nahodne spawnovanie nepriataleskych miest
        let enemyCitiesSpawned = 0;
        let randomCitiesCount = Math.floor(Math.random() * 3) + 3;
        while (enemyCitiesSpawned < randomCitiesCount) {
            let rx = Math.floor(Math.random() * MAP_SIZE);
            let ry = Math.floor(Math.random() * MAP_SIZE);
            let tile = mapData[ry][rx];

            // Ak sme trafili travu a nie je tam ina budova
            if (tile.img === imgLand && !tile.buildingImg) {
                const keepImg = new Image();
                keepImg.src = '../Resources/Buildables/Castle/Img_CastleKeep.png';
                
                tile.buildingImg = keepImg;
                tile.buildingSrc = keepImg.src;
                tile.buildingLevel = 1;
                
                enemyCitiesSpawned++;
            }
        }
        

        // Spustenie vykreslovacej slucky
        requestAnimationFrame(draw);
    }

    // Prizposobenie velkosti platna pri zmene velkosti okna
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        clampCamera();
    });

    // Funkcia, ktora zabrani kamere ist mimo mapu
    function clampCamera() {
        const minCamX = canvas.width - (MAP_SIZE * TILE_SIZE * camera.zoom);
        const minCamY = canvas.height - (MAP_SIZE * TILE_SIZE * camera.zoom);

        if (camera.x > 0) camera.x = 0; 
        if (camera.y > 0) camera.y = 0; 
        if (camera.x < minCamX) camera.x = minCamX; 
        if (camera.y < minCamY) camera.y = minCamY; 
    }

    // Hlavna vykreslovacia funkcia (kresli mapu kazdy fram/snimok)
    function draw(timestamp) {
            // Vypočítame delta čas v sekundách (napr. 0.016 pre 60 FPS)
            let deltaTime = (timestamp - lastTime) / 1000;
            lastTime = timestamp;

            // Ochrana pred obrovským skokom (napr. ak hráč minimalizuje prehliadač alebo prepne kartu)
            if (deltaTime > 0.1) deltaTime = 0.1;

            // Resetovanie platna pred novym kreslenim
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Aplikovanie pozicie a zoomu kamery
            ctx.translate(Math.floor(camera.x), Math.floor(camera.y));
            ctx.scale(camera.zoom, camera.zoom);
            ctx.imageSmoothingEnabled = false; // Aby boli pixely ostre

            clampCamera();

            // Kreslenie samotnych blokov a budov z pamate
            for (let y = 0; y < MAP_SIZE; y++) {
                for (let x = 0; x < MAP_SIZE; x++) {
                    const tile = mapData[y][x];
                    
                    if (tile.img) {
                        ctx.drawImage(tile.img, x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE + 1, TILE_SIZE + 1);
                    }
                    // Logika progress baru pri tazeni lesa
                    if (tile.isClearing) {
                        const now = Date.now();
                        const elapsed = now - tile.clearStartTime;
                        const progress = Math.min(elapsed / tile.clearDuration, 1);

                        // Vykreslenie slidera nad tile
                        const barWidth = TILE_SIZE * 0.8;
                        const barHeight = 10;
                        const barX = x * TILE_SIZE + (TILE_SIZE - barWidth) / 2;
                        const barY = y * TILE_SIZE + 10;

                        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
                        ctx.fillRect(barX, barY, barWidth, barHeight);
                        ctx.fillStyle = "#d9ff00";
                        ctx.fillRect(barX, barY, barWidth * progress, barHeight);

                        // Kontrola, či už ubehlo 10 sekúnd
                        if (progress >= 1) {
                            tile.isClearing = false;
                            if (tile.clearingSound) {
                                tile.clearingSound.pause();
                                tile.clearingSound.currentTime = 0;
                                tile.clearingSound = null;
                            }
                            const landImg = new Image();
                            landImg.src = '../Resources/Tiles/Img_LandDefault.png';
                            tile.img = landImg;
          
                            currentWood += 50;
                            spawnFloatingText("+50 Wood", x, y, "#d9ff00");
                            updateHUD();
                        }
                    }

                    if (tile.buildingImg) {
                        ctx.drawImage(tile.buildingImg, x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                    }
                }
            }

            // Aktualizácia a vykreslenie NPCs s odovzdaním deltaTime
            if (typeof activeNPCs !== 'undefined') {
                activeNPCs.forEach(npc => {
                    if (typeof npc.update === 'function') npc.update(deltaTime);
                });

                activeNPCs.forEach(npc => {
                    if (typeof npc.draw === 'function') npc.draw(ctx);
                });
            }

            ctx.setTransform(1, 0, 0, 1, 0, 0);

            // Podmienka pre noc
            if (typeof currentHour !== 'undefined' && (currentHour >= 20 || currentHour < 6)) {
                ctx.save();     
                let opacity = getNightIntensity();
                ctx.fillStyle = `rgba(0, 0, 40, ${opacity})`;
                ctx.fillRect(0, 0, canvas.width, canvas.height);     
                ctx.restore();
            }
            
            // Znovu zavolame kreslenie pre dalsi snimok
            requestAnimationFrame(draw);
        }

    //Plynuly prechod medzi dnom a nocou podla aktualneho casu
    function getNightIntensity() {
        if (typeof currentHour === 'undefined') return 0;
        if (currentHour === 18) return 0.1;
        if (currentHour === 19) return 0.3;
        if (currentHour >= 20 || currentHour < 5) return 0.55; // Uplna noc
        if (currentHour === 5) return 0.2;
        return 0; // Deň
    }

    imgMountains.onload = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const shouldLoad = localStorage.getItem('should_load_game');
        const hasExistingSave = localStorage.getItem('rts_save_slot_1');
        
        console.log("Kontrola vlajky by-load:", shouldLoad);
        console.log("Existuje reálny save?:", hasExistingSave ? "ÁNO" : "NIE");

        if (shouldLoad === 'true') {
            localStorage.removeItem('should_load_game');
            
            if (hasExistingSave) {
                console.log("Spúšťam loadMap()...");
                loadMap(); 
            } else {
                alert("Uložená pozícia sa nenašla! Spúšťam novú mapu.");
                generateNewGameWorld();
            }
        } else {
            console.log("Hráč nechcel loadovať, generujem nový svet.");
            generateNewGameWorld();
        }
    };

    function generateNewGameWorld() {
        camera.x = (canvas.width / 2) - (MAP_SIZE * TILE_SIZE / 2);
        camera.y = (canvas.height / 2) - (MAP_SIZE * TILE_SIZE / 2);
        lastTime = performance.now(); 
        initMap();
    }

    // Zoomovanie kamery kolieskom mysi
    canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            
            const zoomSpeed = 0.1;
            const oldZoom = camera.zoom;

            // Priblizenie alebo oddialenie
            if (e.deltaY < 0) {
                camera.zoom += zoomSpeed;
            } else {
                camera.zoom = Math.max(0.2, camera.zoom - zoomSpeed);
            }

            // Uprava pozicie kamery aby sa zoomovalo tam, kde je kurzor
            const mouseX = e.clientX;
            const mouseY = e.clientY;
            camera.x -= (mouseX - camera.x) * (camera.zoom / oldZoom - 1);
            camera.y -= (mouseY - camera.y) * (camera.zoom / oldZoom - 1);

            clampCamera();

    }, { passive: false });

    // Zaciatok tahania kamery po stlaceni mysi (Drag)
    canvas.addEventListener('mousedown', (e) => {
            isDragging = true;
            lastMouse = { x: e.clientX, y: e.clientY };
    });

    // Samotny pohyb kamery pri tahani mysou
    window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const dx = e.clientX - lastMouse.x;
            const dy = e.clientY - lastMouse.y;
            
            camera.x += dx;
            camera.y += dy;
            
            clampCamera();

            lastMouse = { x: e.clientX, y: e.clientY };
    });

    function startBattle() {
        console.log("Starting Field Battle...");
        // Rovno otvorí Field bitku v novom okne
        window.open('../Battle/battle.html?type=field', '_blank');
    }

    function closeBattleMenu() {
        const modal = document.getElementById('battle-menu-modal');
        modal.style.animation = 'none'; // Resetne animáciu, aby fungovala aj nabudúce
        modal.style.display = 'none';
    }

    function selectBattleType(type) {
        console.log("Hráč si vybral bitku: " + type);
        // Logika bitky pôjde sem
    }

    // Koniec tahania kamery po pusteni mysi
    window.addEventListener('mouseup', () => isDragging = false);

    // Asynchronna funkcia na nacitanie bocneho menu s budovami podla kategorie
    async function loadBuildingMenu(filterCategory = 'houses') {
        const menuContainer = document.getElementById('building-menu');
        // Najdenie tlacidla (kategorie), na ktore sa kliklo
        const clickedBtn = Array.from(document.querySelectorAll('.cat-btn')).find(btn => btn.innerText.toLowerCase() === filterCategory);

        // Ak klikneme na tu istu kategoriu, ktora je uz otvorena, zavrie sa menu
        if (clickedBtn && clickedBtn.classList.contains('active')) {
            clickedBtn.classList.remove('active');
            menuContainer.classList.remove('show-menu'); 
            
            setTimeout(() => {
                menuContainer.innerHTML = ''; 
            }, 300);
            return; 
        }

        // Ak otvarame novu kategoriu, stiahneme data z JSON suboru
        const response = await fetch('../Data/buildablesList.json');
        const buildings = await response.json();
        window.gameBuildings = buildings; // Ulozime budovy do globalnej premennej pre lahký pristup z inych skriptov

        // Najprv skryjeme aktualne otvorene menu
        menuContainer.classList.remove('show-menu');

        // Kratka pauza kym sa spusti animacia skrytia, potom vygenerujeme nove tlacidla budov
        setTimeout(() => {
            menuContainer.innerHTML = '';

            // Oznacime spravne tlacidlo ako aktivne (zlte)
            document.querySelectorAll('.cat-btn').forEach(btn => btn.classList.remove('active'));
            if(clickedBtn) clickedBtn.classList.add('active');

            // Vyfiltrujeme a vygenerujeme iba budovy pre danu kategoriu
            buildings.filter(b => b.category === filterCategory).forEach(building => {
                const popCost = building.popCost || 1;
                const buildingElement = document.createElement('div');
                buildingElement.id = 'building-menu-element'; 

                // Vytvorenie HTML elementu pre kartu kazdej budovy v menu
                buildingElement.innerHTML = `
                    <img id="building-menu-element-img" src="${building.image}" alt="${building.name}">
                    <p id="building-menu-element-name">${building.name}</p>
                    <p id="building-menu-element-level">lvl. ${building.level}</p>
                    <p id="building-menu-element-price">${building.price} G | ${popCost} 👥</p>
                    <button id="building-menu-element-button" onclick="startBuilding('${building.image}', ${building.maxBuildLevel}, ${building.price}, ${popCost}, '${building.category}', ${building.level})">Build</button>
                `;
                menuContainer.appendChild(buildingElement);
            });

            // Pockame na vykreslenie prehliadacom a spustime animaciu vysunutia
            requestAnimationFrame(() => {
                menuContainer.classList.add('show-menu');
            });
        }, 150);
    }

// Len testovacia funkcia do logu v prehliadaci
function showInfo(id) {
    console.log("Klikli ste na budovu s ID:", id);
}

// Nacita defaultnu kategoriu budov ('houses') po starte hry
loadBuildingMenu();

//Ukladanie
function saveMap() {
    if (!mapData || mapData.length === 0 || !mapData[0]) {
        console.log("Ukladanie zrušené: Mapa nie je pripravená.");
        return;
    }

    const savedTiles = [];

    // 1. Uloženie mriežky mapy (terén + budovy)
    for (let y = 0; y < MAP_SIZE; y++) {
        savedTiles[y] = [];
        for (let x = 0; x < MAP_SIZE; x++) {
            const tile = mapData[y][x];
            if (!tile) continue;
            
            const tileSave = {
                type: tile.type,
                n: tile.n
            };

            if (tile.buildingImg) {
                tileSave.buildingSrc = tile.buildingSrc;
                tileSave.buildingLevel = tile.buildingLevel;
            }

            savedTiles[y][x] = tileSave;
        }
    }

    // 2. Extrahovanie čistých dát z activeNPCs
    const savedNPCs = (typeof activeNPCs !== 'undefined' ? activeNPCs : []).map(npc => {
        return {
            id: npc.id,
            name: npc.name,
            profession: npc.profession,
            img: npc.img,
            homeX: npc.homeX,
            homeY: npc.homeY,
            x: npc.x,
            y: npc.y,
            targetX: npc.targetX,
            targetY: npc.targetY,
            health: npc.health,
            hunger: npc.hunger,
            happiness: npc.happiness,
            workplaceX: npc.workplaceX,
            workplaceY: npc.workplaceY,
            state: npc.state
        };
    });

    // 3. Vytvorenie hlavného objektu uloženej pozície
    const saveGameData = {
        mapSize: MAP_SIZE,
        camera: { x: camera.x, y: camera.y, zoom: camera.zoom },
        time: {
            day: typeof currentDay !== 'undefined' ? currentDay : 1,
            hour: typeof currentHour !== 'undefined' ? currentHour : 8,
            minute: typeof currentMinute !== 'undefined' ? currentMinute : 0
        },
        map: savedTiles,
        npcs: savedNPCs,
        workplaces: {
            fields: typeof activeFields !== 'undefined' ? activeFields : [],
            mines: typeof activeMines !== 'undefined' ? activeMines : [],
            lumberyards: typeof activeLumberyards !== 'undefined' ? activeLumberyards : [],
            barracks: typeof activeBarracks !== 'undefined' ? activeBarracks : []
        },
        resources: {
            gold: typeof currentGold !== 'undefined' ? currentGold : 0,
            pop: typeof currentPop !== 'undefined' ? currentPop : 0,
            wood: typeof currentWood !== 'undefined' ? currentWood : 0,
            stone: typeof currentStone !== 'undefined' ? currentStone : 0,
            food: typeof currentFood !== 'undefined' ? currentFood : 0,
            level: typeof currentLevel !== 'undefined' ? currentLevel : 1,
            xp: typeof currentXP !== 'undefined' ? currentXP : 0
        }
    };

    localStorage.setItem('rts_save_slot_1', JSON.stringify(saveGameData));
    console.log("Hra bola úspešne uložená!");
    if (typeof showWarning === 'function') showWarning("Autosaving game", "yellow");
}

function loadMap() {
    const rawData = localStorage.getItem('rts_save_slot_1');
    
    if (!rawData) {
        alert("Nenašlo sa žiadne uložené pozícia!");
        return;
    }

    const saveData = JSON.parse(rawData);

    // 1. Obnovíme základné nastavenia a kameru
    MAP_SIZE = saveData.mapSize;
    camera.x = saveData.camera.x;
    camera.y = saveData.camera.y;
    camera.zoom = saveData.camera.zoom;

    if (saveData.time && typeof currentDay !== 'undefined') {
        currentDay = saveData.time.day;
        currentHour = saveData.time.hour;
        currentMinute = saveData.time.minute - 10; 
        if (currentMinute < 0) {
            currentMinute = 50; currentHour--;
            if (currentHour < 0) { currentHour = 23; currentDay--; }
        }
        if (typeof updateTime === 'function') updateTime(); 
    }

    // 2. Načítanie aktívnych pracovísk
    if (saveData.workplaces) {
        if (typeof activeFields !== 'undefined') activeFields = saveData.workplaces.fields || [];
        if (typeof activeMines !== 'undefined') activeMines = saveData.workplaces.mines || [];
        if (typeof activeLumberyards !== 'undefined') activeLumberyards = saveData.workplaces.lumberyards || [];
        if (typeof activeBarracks !== 'undefined') activeBarracks = saveData.workplaces.barracks || [];
    }

    if (saveData.resources) {
        if (typeof currentGold !== 'undefined') currentGold = saveData.resources.gold;
        if (typeof currentPop !== 'undefined') currentPop = saveData.resources.pop;
        if (typeof currentWood !== 'undefined') currentWood = saveData.resources.wood;
        if (typeof currentStone !== 'undefined') currentStone = saveData.resources.stone;
        if (typeof currentFood !== 'undefined') currentFood = saveData.resources.food;
        if (typeof currentLevel !== 'undefined') currentLevel = saveData.resources.level;
        if (typeof currentXP !== 'undefined') currentXP = saveData.resources.xp;
    }

    // Pomocný slovník pre priradenie obrázkov terénu
    const imageMap = {
        'water': imgWater, 'land': imgLand, 'mountains': imgMountains, 'hills': imgHills,
        'forest1': imgForest1, 'forest2': imgForest2, 'forest3': imgForest3, 'forest4': imgForest4
    };

    // 3. Rekonštrukcia mapData
    mapData = [];
    for (let y = 0; y < MAP_SIZE; y++) {
        mapData[y] = [];
        for (let x = 0; x < MAP_SIZE; x++) {
            const tileData = saveData.map[y][x];
            if (!tileData) continue;

            const tile = {
                n: tileData.n,
                type: tileData.type,
                img: imageMap[tileData.type]
            };

            if (tileData.buildingSrc) {
                const bImg = new Image();
                bImg.src = tileData.buildingSrc;

                tile.buildingImg = bImg;
                tile.buildingSrc = tileData.buildingSrc;
                tile.buildingLevel = tileData.buildingLevel;
            }

            mapData[y][x] = tile;
        }
    }

    // 4. Načítanie a oživenie NPCs
    if (typeof activeNPCs !== 'undefined') {
        activeNPCs = []; 
        const npcListElement = document.getElementById("citizens-list");
        if (npcListElement) {
            npcListElement.innerHTML = '';
        }

        if (saveData.npcs && Array.isArray(saveData.npcs)) {
            saveData.npcs.forEach(npcData => {
                if (typeof NPC !== 'undefined') {
                    const restoredNpc = new NPC(
                        npcData.id,
                        npcData.name,
                        npcData.profession,
                        npcData.img,
                        npcData.homeX,
                        npcData.homeY,
                        npcData.health,
                        npcData.hunger,
                        npcData.happiness,
                        npcData.workplaceX,
                        npcData.workplaceY
                    );

                    restoredNpc.x = npcData.x;
                    restoredNpc.y = npcData.y;
                    restoredNpc.targetX = npcData.targetX;
                    restoredNpc.targetY = npcData.targetY;
                    restoredNpc.state = npcData.state;

                    activeNPCs.push(restoredNpc);

                    if (typeof updateCitizensList === 'function') {
                        updateCitizensList(restoredNpc.name);
                    }
                }
            });
        }
    }

    // Aktualizácia HUD panelu s novými načítanými surovinami
    if (typeof updateHUD === 'function') {
        updateHUD();
    }

    console.log("Hra bola kompletne načítaná úspešne!");
    clampCamera();

    requestAnimationFrame(draw);
}

//Autosave
setInterval(() => {
    if (mapData && mapData.length > 0) {
        saveMap();
    }
}, 30000);


// ==========================================
// --- INVASION MINIGAME (DEFEND VILLAGE) ---
// ==========================================

window.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('underAttack') && urlParams.get('underAttack') === 'true') {
        // Vymaže parameter z URL, aby sa minihra nespúšťala po každom refreshi
        const url = new URL(window.location);
        url.searchParams.delete('underAttack');
        window.history.replaceState({}, document.title, url);
        
        // Spustí minihru s menším oneskorením, aby sa stihla načítať hlavná mapa
        setTimeout(startInvasionMinigame, 1000);
    }
});

function startInvasionMinigame() {
    alert("🚨 YOUR VILLAGE IS UNDER ATTACK! 🚨\nClick on the invaders to stop them from reaching the center!");

    // Vytvorenie priehľadného plátna pre minihru priamo nad tvojím svetom
    const mgCanvas = document.createElement('canvas');
    mgCanvas.id = 'minigameCanvas';
    mgCanvas.style.position = 'fixed';
    mgCanvas.style.top = '0';
    mgCanvas.style.left = '0';
    mgCanvas.style.width = '100vw';
    mgCanvas.style.height = '100vh';
    mgCanvas.style.zIndex = '9999'; // Úplne navrchu, blokuje dragovanie sveta pod ním
    mgCanvas.style.cursor = 'crosshair';
    document.body.appendChild(mgCanvas);

    const mgCtx = mgCanvas.getContext('2d');
    mgCanvas.width = window.innerWidth;
    mgCanvas.height = window.innerHeight;

    let invaders = [];
    let villageHp = 10; // Koľko nepriateľov môže prejsť, kým prehráš
    let killsNeeded = 25; // Koľko ich musíš zabiť na výhru
    let kills = 0;
    let minigameActive = true;

    // Generovanie nepriateľov
    let spawnInterval = setInterval(() => {
        if (!minigameActive) return clearInterval(spawnInterval);

        let edge = Math.floor(Math.random() * 4);
        let startX, startY;
        let w = mgCanvas.width;
        let h = mgCanvas.height;

        if (edge === 0) { startX = Math.random() * w; startY = -50; } // Hore
        else if (edge === 1) { startX = w + 50; startY = Math.random() * h; } // Vpravo
        else if (edge === 2) { startX = Math.random() * w; startY = h + 50; } // Dole
        else { startX = -50; startY = Math.random() * h; } // Vľavo

        invaders.push({
            x: startX,
            y: startY,
            size: 20 + Math.random() * 10,
            speed: 1.5 + Math.random() * 1.5
        });
    }, 1000); // Každú sekundu vybehne jeden nepriateľ

    // Klikanie (Zabíjanie nepriateľov)
    mgCanvas.addEventListener('mousedown', (e) => {
        if (!minigameActive) return;
        const clickX = e.clientX;
        const clickY = e.clientY;

        for (let i = invaders.length - 1; i >= 0; i--) {
            let inv = invaders[i];
            let dist = Math.hypot(inv.x - clickX, inv.y - clickY);
            if (dist < inv.size * 1.5) { // Hitbox tolerancia (kliknutie nemusí byť na pixel presné)
                invaders.splice(i, 1);
                kills++;
                
                // Vykreslenie malej stopy po zabití
                mgCtx.fillStyle = "rgba(255, 0, 0, 0.5)";
                mgCtx.beginPath();
                mgCtx.arc(clickX, clickY, 20, 0, Math.PI * 2);
                mgCtx.fill();
                
                if (kills >= killsNeeded) {
                    endMinigame(true);
                }
                break; // Zabije len jedného na jeden klik
            }
        }
    });

    // Slučka minihry
    function mgLoop() {
        if (!minigameActive) return;

        mgCtx.clearRect(0, 0, mgCanvas.width, mgCanvas.height);

        // Vykreslenie stredu (Obranná zóna)
        const centerX = mgCanvas.width / 2;
        const centerY = mgCanvas.height / 2;
        
        mgCtx.fillStyle = "rgba(0, 0, 0, 0.6)";
        mgCtx.fillRect(centerX - 60, centerY - 40, 120, 80);
        mgCtx.fillStyle = "white";
        mgCtx.font = "bold 18px Arial";
        mgCtx.textAlign = "center";
        mgCtx.fillText("TOWN HP: " + villageHp, centerX, centerY - 5);
        mgCtx.fillText("KILLS: " + kills + "/" + killsNeeded, centerX, centerY + 20);

        // Pohyb a vykreslenie nepriateľov
        for (let i = invaders.length - 1; i >= 0; i--) {
            let inv = invaders[i];
            let dx = centerX - inv.x;
            let dy = centerY - inv.y;
            let dist = Math.hypot(dx, dy);

            if (dist < 40) {
                // Nepriateľ sa dostal do dediny
                invaders.splice(i, 1);
                villageHp--;
                
                // Vizuálny efekt zranenia stredu
                mgCtx.fillStyle = "rgba(255, 0, 0, 0.8)";
                mgCtx.fillRect(centerX - 60, centerY - 40, 120, 80);
                
                if (villageHp <= 0) {
                    endMinigame(false);
                }
            } else {
                // Posun nepriateľa
                inv.x += (dx / dist) * inv.speed;
                inv.y += (dy / dist) * inv.speed;

                // Vykreslenie (červený kruh symbolizujúci nepriateľa)
                mgCtx.fillStyle = "#ff3333";
                mgCtx.beginPath();
                mgCtx.arc(inv.x, inv.y, inv.size, 0, Math.PI * 2);
                mgCtx.fill();
                mgCtx.strokeStyle = "#8b0000";
                mgCtx.lineWidth = 3;
                mgCtx.stroke();
            }
        }

        requestAnimationFrame(mgLoop);
    }

    function endMinigame(won) {
        minigameActive = false;
        mgCanvas.remove(); 
        
        if (won) {
            alert("Victory! You have defended your village from the invaders!");
        } else {
            alert("Defeat! The invaders have plundered your village and stolen some of your gold!");
            // Odobratie 500 goldov ako trest za prehru
            if (typeof currentGold !== 'undefined') {
                currentGold = Math.max(0, currentGold - 500); 
                if (typeof updateHUD === 'function') updateHUD(); 
            }
        }
    }

    // Odštartovanie slučky minihry
    mgLoop();
}