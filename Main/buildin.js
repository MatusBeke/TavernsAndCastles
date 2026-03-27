{
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    // 1. Camera & Map State
    let camera = { x: 0, y: 0, zoom: 1 };
    let isDragging = false;
    let lastMouse = { x: 0, y: 0 };
    const MAP_SIZE = 50;
    const TILE_SIZE = 32;
    let mapData = []; // Store the noise values so we don't re-calculate every frame

    // 2. Load Images (Using the relative path we discussed)
    const imgWater = new Image(); imgWater.src = '../Resources/Tiles/Img_WaterDefault.gif';
    const imgLand = new Image(); imgLand.src = '../Resources/Tiles/Img_LandDefault.png';
    const imgMountains = new Image(); imgMountains.src = '../Resources/Tiles/Img_MountainsDefault.png';

    // Initialize Map Data
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

    // 3. The Drawing Loop
    function draw() {
        // Clear canvas and fill with a background color
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Apply Camera Transform
        ctx.translate(Math.floor(camera.x), Math.floor(camera.y));
        ctx.scale(camera.zoom, camera.zoom);
        ctx.imageSmoothingEnabled = false;

        for (let y = 0; y < MAP_SIZE; y++) {
            for (let x = 0; x < MAP_SIZE; x++) {
                const n = mapData[y][x];
                let img = n < 0.4 ? imgWater : (n < 0.75 ? imgLand : imgMountains);
                
                ctx.drawImage(img, x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE + 1, TILE_SIZE + 1);
            }
        }
        requestAnimationFrame(draw);
    }

    // 4. Input Listeners (Drag & Zoom)
    
    // Zoom with Scroll
    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const zoomSpeed = 0.1;
        if (e.deltaY < 0) camera.zoom += zoomSpeed;
        else camera.zoom = Math.max(0.2, camera.zoom - zoomSpeed); // Don't zoom out too far
    }, { passive: false });

    // Drag with Mouse
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

    // Initial Trigger
    imgMountains.onload = () => {
        // Ensure canvas fills the screen or your container
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        initMap();
    };
}