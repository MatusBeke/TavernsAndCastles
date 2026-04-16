//Generovanie mapy za pouzitia Perlin Noise a poyb kamery pomocou mysky
var MAP_SIZE = 200;
var TILE_SIZE = 128;
var mapData = []; 
var camera = { x: 0, y: 0, zoom: 1 };

{
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    let isDragging = false;
    let lastMouse = { x: 0, y: 0 };

    //Parametre generovania mapy cez noise
    let waterLevel = 0.4;
    let landLevel = 0.75;
    let mountainLevel = 1;
    //Biomy
    let forestLevel = 0.55;
    let hillsLevel = 0.8;

    //Nacitavanie obrazkov
    const imgWater = new Image(); imgWater.src = '../Resources/Tiles/Img_WaterDefault.gif';
    const imgLand = new Image(); imgLand.src = '../Resources/Tiles/Img_LandDefault.png';
    const imgMountains = new Image(); imgMountains.src = '../Resources/Tiles/Img_Mountains.png';

    //Les
    const imgForest1 = new Image(); imgForest1.src = '../Resources/Tiles/Img_Forest1.png';
    const imgForest2 = new Image(); imgForest2.src = '../Resources/Tiles/Img_Forest2.png';
    const imgForest3 = new Image(); imgForest3.src = '../Resources/Tiles/Img_Forest3.png';
    const imgForest4 = new Image(); imgForest4.src = '../Resources/Tiles/Img_Forest4.png';
    const imgHills = new Image(); imgHills.src = '../Resources/Tiles/Img_Hills.png';

    function initMap() {
        noise.seed(Math.random());
        const NOISE_ZOOM = 0.08;
        const forestImages = [imgForest1, imgForest2, imgForest3, imgForest4];

        for (let y = 0; y < MAP_SIZE; y++) {
            mapData[y] = [];
            for (let x = 0; x < MAP_SIZE; x++) {
                let n = (noise.perlin2(x * NOISE_ZOOM, y * NOISE_ZOOM) + 1) / 2;
                let tileImg;
                if (n < waterLevel) {
                    tileImg = imgWater;
                } else if (n < landLevel) {
                    if (n < forestLevel) {
                        // Gnerovanie casti lesa podla sance 0 - 1
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
                        tileImg = imgLand;
                    }
                } else {
                    tileImg = (n < hillsLevel) ? imgHills : imgMountains;
                }
                mapData[y][x] = { n: n, img: tileImg };
            }
        }
    requestAnimationFrame(draw);
    }

    function draw() {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        ctx.translate(Math.floor(camera.x), Math.floor(camera.y));
        ctx.scale(camera.zoom, camera.zoom);
        ctx.imageSmoothingEnabled = false;

        for (let y = 0; y < MAP_SIZE; y++) {
            for (let x = 0; x < MAP_SIZE; x++) {
                // Get the pre-calculated image
                const tile = mapData[y][x];
                
                if (tile.img) {
                    ctx.drawImage(tile.img, x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE + 1, TILE_SIZE + 1);
                }
                if (tile.buildingImg) {
                    ctx.drawImage(tile.buildingImg, x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                }
            }
        }
        requestAnimationFrame(draw);
    }

        // Zoom
    canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            
            const zoomSpeed = 0.1;
            const oldZoom = camera.zoom;

            if (e.deltaY < 0) {
                camera.zoom += zoomSpeed;
            } else {
                camera.zoom = Math.max(0.2, camera.zoom - zoomSpeed);
            }

            const mouseX = e.clientX;
            const mouseY = e.clientY;
            camera.x -= (mouseX - camera.x) * (camera.zoom / oldZoom - 1);
            camera.y -= (mouseY - camera.y) * (camera.zoom / oldZoom - 1);

    }, { passive: false });

    // Drag
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
            
            lastMouse = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mouseup', () => isDragging = false);

    imgMountains.onload = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;

            // Vycentrovanie kamery na stred mapy
            camera.x = (canvas.width / 2) - (MAP_SIZE * TILE_SIZE / 2);
            camera.y = (canvas.height / 2) - (MAP_SIZE * TILE_SIZE / 2);

            initMap();
        };
    }

    async function loadBuildingMenu(filterCategory = 'houses') {
        const menuContainer = document.getElementById('building-menu');
        
        const clickedBtn = Array.from(document.querySelectorAll('.cat-btn')).find(btn => btn.innerText.toLowerCase() === filterCategory);

        if (clickedBtn && clickedBtn.classList.contains('active')) {
            menuContainer.innerHTML = ''; 
            clickedBtn.classList.remove('active'); 
            return; 
        }

        const response = await fetch('../Data/buildablesList.json');
        const buildings = await response.json();
        menuContainer.innerHTML = '';

        document.querySelectorAll('.cat-btn').forEach(btn => btn.classList.remove('active'));
        if(clickedBtn) clickedBtn.classList.add('active');

        buildings.filter(b => b.category === filterCategory).forEach(building => {
            const popCost = building.popCost || 1;
            const buildingElement = document.createElement('div');
            buildingElement.id = 'building-menu-element'; 

            buildingElement.innerHTML = `
                <img id="building-menu-element-img" src="${building.image}" alt="${building.name}">
                <p id="building-menu-element-name">${building.name}</p>
                <p id="building-menu-element-level">lvl. ${building.level}</p>
                <p id="building-menu-element-price">${building.price} G | ${popCost} 👥</p>
                <button id="building-menu-element-button" onclick="startBuilding('${building.image}', ${building.maxBuildLevel}, ${building.price}, ${popCost})">Build</button>
            `;
            menuContainer.appendChild(buildingElement);
        });
    }

function showInfo(id) {
    console.log("Klikli ste na budovu s ID:", id);
}

loadBuildingMenu();