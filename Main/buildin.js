//Generating map using noisejs library
function generateMap(size, water, land, mountains) {
    noise.seed(Math.random());

    const MAP_SIZE = size;
    const ZOOM = 0.3;
    let textMap = "";

    let waterLevel = water;
    let landLevel = land;
    let mountainLevel = mountains;

    for (let y = 0; y < MAP_SIZE; y++) {
        let row = "";
        for (let x = 0; x < MAP_SIZE; x++) {
            let val = noise.perlin2(x * ZOOM, y * ZOOM);
            let n = (val + 1) / 2;

            // Determine terrain
            if (n < waterLevel) {
                row += "🟦"; // Water
            } else if (n < landLevel) {
                row += "🟩"; // Land
            } else if (n < mountainLevel){
                row += "🏔️"; // Mountains
            }
        }
        textMap += row + "\n";
    }
    console.log("%c--- Generated World Map ---", "color: #e67e22; font-weight: bold;");
    console.log(textMap);
}
generateMap(50, 0.4, 0.75, 1);