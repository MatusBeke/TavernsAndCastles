var activeNPCs = [];
const npcList = document.getElementById("citizens-list");

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

        setInterval(this.wander.bind(this), 1000);
    }

    draw(ctx) {
        if (this.profession === "peasant") {
            ctx.fillStyle = "#8B4513"; 
        }
        else if (this.profession === "blacksmith") {
            ctx.fillStyle = "#7b7e81"; 
        }
        else if (this.profession === "merchant") {
            ctx.fillStyle = "#228B22"; 
        }
        else if (this.profession === "guard") {
            ctx.fillStyle = "#800000"; 
        }
        else {
            ctx.fillStyle = "red"; 
        }
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);

        ctx.fillStyle = "white";     
        ctx.font = "bold 12px Arial"; 
        ctx.textAlign = "center"; 
        ctx.fontFamily = "Arial"; 
        
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
}

function createNPC(homeX, homeY, profession = "peasant", img = null, workplaceX = null, workplaceY = null) {
    const firstNames = npcNamesData.npc_names.first_names;
    const lastNames = npcNamesData.npc_names.surnames;

    const randomFirst = firstNames[Math.floor(Math.random() * firstNames.length)];
    const randomLast = lastNames[Math.floor(Math.random() * lastNames.length)];
    
    const fullName = `${randomFirst} ${randomLast}`;

    var npc = new NPC(
        activeNPCs.length + 1, 
        fullName, 
        profession,  
        img,
        homeX, 
        homeY, 
        100, 
        100, 
        100,  
        workplaceX,
        workplaceY
    );

    if (profession == "peasant") {
         if (typeof activeFields !== 'undefined' && activeFields.length > 0) {
            const field = activeFields[Math.floor(Math.random() * activeFields.length)];
            let [x, y] = field.split(',').map(Number);
            npc.workplaceX = x;
            npc.workplaceY = y;
        } else {
            npc.workplaceX = null;
            npc.workplaceY = null;
        }
    }

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
    const modal = document.getElementById('npc-info-modal');
    if (!modal) return;
    modal.style.display = 'flex'; 

    document.getElementById('npc-info-name').innerText = npc.name;
    document.getElementById('npc-info-profession').innerText = `Povolanie: ${npc.profession}`;
    document.getElementById('npc-info-state').innerText = `Stav: ${npc.state}`;
    document.getElementById('npc-info-health').innerText = `${npc.health}/100`;
    document.getElementById('npc-info-hunger').innerText = npc.hunger;
    document.getElementById('npc-info-happiness').innerText = npc.happiness;
    
    const workText = (npc.workplaceX !== null) ? `Súradnice: [${npc.workplaceX}, ${npc.workplaceY}]` : "Nezamestnaný";
    document.getElementById('npc-info-work').innerText = workText;

    if (npc.img) {
        document.getElementById('npc-info-img').src = npc.img;
    }
}

function closeNpcInfo() {
    const modal = document.getElementById('npc-info-modal');
    if (modal) modal.style.display = 'none';
}

function assignWork() {
    console.log("Logic for assigning work goes here...");
}