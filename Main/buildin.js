//Generovanie mapy za pouzitia Perlin Noise a poyb kamery pomocou mysky
{
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    let camera = { x: 0, y: 0, zoom: 1 };
    let isDragging = false;
    let lastMouse = { x: 0, y: 0 };
    const MAP_SIZE = 50;
    const TILE_SIZE = 128;
    let mapData = []; 

    let waterLevel = 0.4;
    let landLevel = 0.75;
    let mountainLevel = 1;

    //Nacitavanie obrazkov
    const imgWater = new Image(); imgWater.src = '../Resources/Tiles/Img_WaterDefault.gif';
    const imgLand = new Image(); imgLand.src = '../Resources/Tiles/Img_LandDefault.png';
    const imgMountains = new Image(); imgMountains.src = '../Resources/Tiles/Img_MountainsDefault.png';

    function initMap() {
        noise.seed(Math.random());
        const NOISE_ZOOM = 0.08;
        for (let y = 0; y < MAP_SIZE; y++) {
            mapData[y] = [];
            for (let x = 0; x < MAP_SIZE; x++) {
                let n = (noise.perlin2(x * NOISE_ZOOM, y * NOISE_ZOOM) + 1) / 2;
                mapData[y][x] = n;
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
                const n = mapData[y][x];
                let img;
                
                if (n < waterLevel){
                    img = imgWater
                }
                else if(n < landLevel){
                    img = imgLand
                }
                else if (n < mountainLevel){
                    img = imgMountains
                }
                
                ctx.drawImage(img, x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE + 1, TILE_SIZE + 1);
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

// Funkcia na načítanie budov na stavbu z JSON súboru
async function loadBuildingMenu() {
    const menuContainer = document.getElementById('building-menu');
    
    try {
        const response = await fetch('../Data/buildablesList.json');
        const buildings = await response.json();
        menuContainer.innerHTML = '';

        buildings.forEach(building => {
            const buildingElement = document.createElement('div');
            buildingElement.id = 'building-menu-element'; 

            buildingElement.innerHTML = `
                <img id="building-menu-element-img" src="${building.image}" alt="${building.name}">
                <p id="building-menu-element-name">${building.name}</p>
                <p id="building-menu-element-level">lvl. ${building.level}</p>
                <p id="building-menu-element-price">${building.price} G</p>
                <button id="building-menu-element-button" onclick="showInfo('${building.id}')">More info</button>
            `;

            menuContainer.appendChild(buildingElement);
        });

    } catch (error) {
        console.error("Chyba pri načítaní menu:", error);
    }
}

function showInfo(id) {
    console.log("Klikli ste na budovu s ID:", id);
}

loadBuildingMenu();