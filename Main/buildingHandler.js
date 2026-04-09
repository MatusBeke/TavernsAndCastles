let isBuildingMode = false;
let selectedBuildingImg = null;
let maxBuildLevel = null;



function startBuilding(imageSrc, maxLVL) {
    isBuildingMode = true;
    selectedBuildingImg = new Image();
    selectedBuildingImg.src = imageSrc;
    maxBuildLevel = maxLVL;
    
    document.getElementById('gameCanvas').style.cursor = "crosshair";
    console.log("Build mode active");
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

        // LOGIC A: If a building already exists AND we are in Build Mode
        if (tile.buildingImg) {
            // Increase level
            tile.buildingLevel = (tile.buildingLevel || 1) + 1;
            console.log(`Attempting to upgrade building ${tile.buildingImg.src} at ${gridX}, ${gridY} to level ${tile.buildingLevel}`);
            
            if (tile.buildingLevel > maxBuildLevel) {
                console.log("Building is at maximum level.");
                return; 
            }

            const newImg = new Image();
            newImg.src = tile.buildingImg.src.replace(/(\d+)(?=\.\w+$)/, tile.buildingLevel);
            tile.buildingImg = newImg;
            console.log(`Building upgraded! Now level ${tile.buildingLevel}`);
            
            finalizeBuild(canvas);
            return; 
        }

        // LOGIC B: If no building exists, place the first one
        if (selectedBuildingImg) {
            tile.buildingImg = selectedBuildingImg;
            tile.buildingLevel = 1; 
    
            console.log(`First building placed at ${gridX}, ${gridY}`);
            finalizeBuild(canvas);
        }
    }
});

// Helper function to clean up after building
function finalizeBuild(canvas) {
    isBuildingMode = false;
    selectedBuildingImg = null;
    canvas.style.cursor = "default";
}