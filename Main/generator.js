// Generovanie mapy za pouzitia Perlin Noise a pohyb kamery pomocou mysky
var MAP_SIZE = 200;
var TILE_SIZE = 128;
var mapData = []; 
var camera = { x: 0, y: 0, zoom: 1 };

{
    // Pripojenie na HTML canvas pre vykreslovanie
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    // Premenne pre tahanie mapy mysou
    let isDragging = false;
    let lastMouse = { x: 0, y: 0 };

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
                
                // Ulozenie bloku do pamate mapy
                mapData[y][x] = { n: n, img: tileImg };
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
    function draw() {
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
                if (tile.buildingImg) {
                    ctx.drawImage(tile.buildingImg, x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                }
            }
        }

        // Kreslenie NPCs
        activeNPCs.forEach(npc => {
            npc.draw(ctx);
        });

        // Znovu zavolame kreslenie pre dalsi snimok
        requestAnimationFrame(draw);
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

    // Zatial nevyuzita funkcia pre boj
    function startBattle() {
        showWarning("Your army is not ready yet, my God!");
    }

    // Koniec tahania kamery po pusteni mysi
    window.addEventListener('mouseup', () => isDragging = false);

    // Ked sa nacita prvy zakladny obrazok mapy, inicializujeme ju
    imgMountains.onload = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;

            // Vycentrovanie kamery presne na stred mapy pri starte
            camera.x = (canvas.width / 2) - (MAP_SIZE * TILE_SIZE / 2);
            camera.y = (canvas.height / 2) - (MAP_SIZE * TILE_SIZE / 2);

            initMap();
        };
    }

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
                    <button id="building-menu-element-button" onclick="startBuilding('${building.image}', ${building.maxBuildLevel}, ${building.price}, ${popCost}, '${building.category}')">Build</button>
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