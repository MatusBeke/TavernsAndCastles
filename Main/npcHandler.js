var activeNPCs = [];
const npcList = document.getElementById("citizens-list");

let jobs = ["peasant", "miner", "lumberman", "guard"];
let selectedNPC = null;

let peasantImage = "../Resources/NPCs/NPC_Peasant.png";
let minerImage = "../Resources/NPCs/NPC_Miner.png";
let lumbermanImage = "../Resources/NPCs/NPC_Lumberman.png";
let guardImage = "../Resources/NPCs/NPC_Guard.png";

const npcImages = {
    "peasant": new Image(),
    "miner": new Image(),
    "lumberman": new Image(),
    "guard": new Image()
};

npcImages["peasant"].src = peasantImage;
npcImages["miner"].src = minerImage;
npcImages["lumberman"].src = lumbermanImage;
npcImages["guard"].src = guardImage;

// Default, kým sa nenačíta JSON s menami NPCs
let npcNamesData = {
    npc_names: {
        first_names: ["Villager"],
        surnames: [""]
    }
};

async function loadNPCNames() {
    try {
        const response = await fetch('../Data/npcNames.json');
        npcNamesData = await response.json();
        console.log("NPCNames loaded successfully!");
    } catch (error) {
        console.error("Error loading NPCNames:", error);
    }
}

loadNPCNames();

class NPC {
    constructor(id, name, profession, img, homeX, homeY, health, hunger, happiness, workplaceX = null, workplaceY = null) {
        this.id = id;
        this.name = name;
        this.profession = profession;
        this.img = img;
        this.homeX = homeX;
        this.homeY = homeY;
        
        this.x = (homeX * TILE_SIZE) + (TILE_SIZE / 2) - 10;
        this.y = (homeY * TILE_SIZE) + (TILE_SIZE / 2) - 15;
        
        this.width = 8;
        this.height = 16;
        
        this.health = health;
        this.hunger = hunger;
        this.happiness = happiness;

        this.workplaceX = workplaceX; 
        this.workplaceY = workplaceY;

        this.state = "Wandering";

        this.lastUpdate = Date.now();

        //setInterval(this.wander.bind(this), 1000);

    }

    update() {
    const teraz = Date.now();

    // Časová kontrola pre aktualizáciu stavu NPC
    if (teraz - this.lastUpdate > 1000) {
        
        if (currentHour >= 20 || currentHour < 6) 
        {
            this.inHome();
        }
        else if(currentHour >= 7 && currentHour < 16)
        {
            if (this.workplaceX !== null && this.workplaceY !== null) 
            {
                this.work();
            }
            else 
            {
                this.state = "Wandering";
                this.wander();
            }
        } 
        else 
        {
            if (this.state === "In Home") 
            {
                this.state = "Wandering";
            }
            this.wander();
        }

        this.lastUpdate = teraz;
    }
}

    draw(ctx) {
        // Find the preloaded image based on the NPC's profession
        const npcImgAsset = npcImages[this.profession];

        // If the image is loaded, draw it. Otherwise, use your old color box as a fallback
        if (npcImgAsset && npcImgAsset.complete && npcImgAsset.naturalWidth !== 0) {
            ctx.drawImage(npcImgAsset, this.x, this.y, this.width, this.height);
        } else {
            // Fallback colors
            if (this.profession === "peasant") { ctx.fillStyle = "#8B4513"; }
            else if (this.profession === "miner") { ctx.fillStyle = "#7b7e81"; }
            else if (this.profession === "lumberman") { ctx.fillStyle = "#228B22"; }
            else if (this.profession === "guard") { ctx.fillStyle = "#800000"; }
            else { ctx.fillStyle = "red"; }
            
            ctx.fillRect(this.x, this.y, this.width, this.height);
            
            ctx.strokeStyle = "white";
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        }

        // --- Text elements remain exactly the same ---
        ctx.fillStyle = "white";     
        ctx.font = "bold 12px Arial"; 
        ctx.textAlign = "center"; 
        
        ctx.fillText(this.name, this.x + this.width / 2, this.y - 22);
        
        ctx.font = "10px Arial";
        ctx.fillStyle = "#FFD700";
        ctx.fillText(`State: ${this.state}`, this.x + this.width / 2, this.y - 8);
    }

    wander() {
        this.state = "Wandering";
        const moveRange = 32; 

        let dx = (Math.random() * moveRange * 2) - moveRange;
        let dy = (Math.random() * moveRange * 2) - moveRange;

        this.x += dx;
        this.y += dy;

        this.x = Math.max(0, Math.min(this.x, MAP_SIZE * TILE_SIZE));
        this.y = Math.max(0, Math.min(this.y, MAP_SIZE * TILE_SIZE));
    }

    returnHome() {
        this.state = "Returning Home";
        this.x = (this.homeX * TILE_SIZE) + (TILE_SIZE / 2) - 10;
        this.y = (this.homeY * TILE_SIZE) + (TILE_SIZE / 2) - 15;
    }

    idle() {
        this.state = "Idle";
    }

    inHome() {
        this.state = "In Home";
        this.x = (this.homeX * TILE_SIZE) + (TILE_SIZE / 2) - 10;
        this.y = (this.homeY * TILE_SIZE) + (TILE_SIZE / 2) - 15;
    }

    work(){
        this.state = "Working";
        const randomOffsetX = Math.random() * (TILE_SIZE - 20);
        const randomOffsetY = Math.random() * (TILE_SIZE - 20);
        if (this.workplaceX !== null && this.workplaceY !== null) {
            this.x = (this.workplaceX * TILE_SIZE) + randomOffsetX;
            this.y = (this.workplaceY * TILE_SIZE) + randomOffsetY;
        }
    }
}


function createNPC(homeX, homeY, profession = "peasant", img = null, workplaceX = null, workplaceY = null) {
    const firstNames = npcNamesData.npc_names.first_names;
    const lastNames = npcNamesData.npc_names.surnames;

    const randomFirst = firstNames[Math.floor(Math.random() * firstNames.length)];
    const randomLast = lastNames[Math.floor(Math.random() * lastNames.length)];
    
    const fullName = `${randomFirst} ${randomLast}`;

    const randomProfession = jobs[Math.floor(Math.random() * jobs.length)];

    let assignedImgPath = img;
    if (!assignedImgPath) {
        if (randomProfession === "peasant") assignedImgPath = peasantImage;
        else if (randomProfession === "miner") assignedImgPath = minerImage;
        else if (randomProfession === "lumberman") assignedImgPath = lumbermanImage;
        else if (randomProfession === "guard") assignedImgPath = guardImage;
    }


    var npc = new NPC(
        activeNPCs.length + 1, 
        fullName, 
        profession = randomProfession,  
        assignedImgPath,
        homeX, 
        homeY, 
        100, 
        100, 
        100,  
        workplaceX,
        workplaceY
    );

    //Pridelovanie pracovnych miest pre NPCs
    selectedNPC = npc; 
    assignWork(); 
    selectedNPC = null;

    activeNPCs.push(npc);
    console.log(`Spawned: ${fullName} as ${profession}, working at (${npc.workplaceX}, ${npc.workplaceY})`);
    updateCitizensList(fullName);

    
}

document.getElementById('gameCanvas').addEventListener('click', (e) => {
    const rect = gameCanvas.getBoundingClientRect();
    
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    if (typeof camera === 'undefined') return;

    const worldX = (screenX - camera.x) / camera.zoom;
    const worldY = (screenY - camera.y) / camera.zoom;

    const clickBuffer = 10; 
    let npcFound = false;

    for (let i = activeNPCs.length - 1; i >= 0; i--) {
        const npc = activeNPCs[i];

        const isInsideX = worldX >= (npc.x - clickBuffer) && worldX <= (npc.x + npc.width + clickBuffer);
        const isInsideY = worldY >= (npc.y - clickBuffer) && worldY <= (npc.y + npc.height + clickBuffer);

        if (isInsideX && isInsideY) {
            console.log(`Selected NPC: ${npc.name}`);
            showNpcInfo(npc);
            npcFound = true;
            break; 
        }
    }

    if (!npcFound) {
        closeNpcInfo();
    }
});

function updateCitizensList(npcName) {
    const listItem = document.createElement("span");
    listItem.id = "stat-citizen-name";
    listItem.textContent = npcName;
    npcList.appendChild(listItem);
}

function castRay() {

}

function shouldSpawnNPC(buildingSrc) {
    const src = buildingSrc.toLowerCase();
    return src.includes('cabin') || src.includes('house');
}

function debugListNPCs() {
    activeNPCs.forEach(npc => npc.identify());
}

function showNpcInfo(npc) {
    selectedNPC = npc;
    const modal = document.getElementById('npc-info-modal');
    if (!modal) return;
    modal.style.display = 'flex'; 

    document.getElementById('npc-info-name').innerText = npc.name;
    document.getElementById('npc-info-profession').innerText = `Proffesion: ${npc.profession}`;
    document.getElementById('npc-info-state').innerText = `State: ${npc.state}`;
    document.getElementById('npc-info-health').innerText = `${npc.health}/100`;
    document.getElementById('npc-info-hunger').innerText = npc.hunger;
    document.getElementById('npc-info-happiness').innerText = npc.happiness;
    
    const workText = (npc.workplaceX !== null) ? `Workplace: [${npc.workplaceX}, ${npc.workplaceY}]` : "Unemployed";
    document.getElementById('npc-info-work').innerText = workText;

    if (npc.img) {
        document.getElementById('npc-info-img').src = npc.img;
    }
}

function closeNpcInfo() {
    const modal = document.getElementById('npc-info-modal');
    if (modal) modal.style.display = 'none';
}

//Priradovanie robotky NPCs, podľa ich profesie, k dostupným pracoviskám v hre
function assignWork() {
    const npc = selectedNPC;
    const profession = npc.profession;

    if (profession === "peasant") {
        if (typeof activeFields !== 'undefined' && activeFields.length > 0) {
            const field = activeFields[Math.floor(Math.random() * activeFields.length)];
            let [x, y] = field.split(',').map(Number);
            npc.workplaceX = x;
            npc.workplaceY = y;
        }
    } 
    else if (profession === "lumberman") {
        if (typeof activeLumberyards !== 'undefined' && activeLumberyards.length > 0) {
            const lumberyard = activeLumberyards[Math.floor(Math.random() * activeLumberyards.length)];
            let [x, y] = lumberyard.split(',').map(Number);
            npc.workplaceX = x;
            npc.workplaceY = y;
        }
    }
    else if (profession === "miner") {
        if (typeof activeMines !== 'undefined' && activeMines.length > 0) {
            const mine = activeMines[Math.floor(Math.random() * activeMines.length)];
            let [x, y] = mine.split(',').map(Number);
            npc.workplaceX = x;
            npc.workplaceY = y;
        }
    }

    console.log(`Práca priradená pre ${npc.name} na súradnice: ${npc.workplaceX}, ${npc.workplaceY}`);
    
    showNpcInfo(npc);
}

function changeWork()
{
    const npc = selectedNPC;
    const profession = npc.profession;

    npc.profession = jobs[Math.floor(Math.random() * jobs.length)];

    if (npc.profession === "peasant") npc.img = peasantImage;
    else if (npc.profession === "miner") npc.img = minerImage;
    else if (npc.profession === "lumberman") npc.img = lumbermanImage;
    else if (npc.profession === "guard") npc.img = guardImage;
    assignWork();
}