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

        this.workplaceX = workplaceX; //TODO: Pridat logiku pre pracoviska a pohyb medzi domom a pracoviskom
        this.workplaceY = workplaceY;

        this.state = "Wandering";

        //Spustenie wander logiky pre NPC hned po vytvoreni 
        //TODO: Pridat viac logiky pre NPCS a prepinanie medzi nimi
        setInterval(this.wander.bind(this), 1000);
    }

    //Vykreslenie NPC
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
        ctx.fillStyle = "red";
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);

        ctx.fillStyle = "white";     
        ctx.font = "bold 12px Arial"; 
        ctx.textAlign = "center"; 
        ctx.fontFamily = "Arial"; //TODO: Pridat vlastny font 
        
        ctx.fillText(this.name, this.x + this.width / 2, this.y - 22);
        
        ctx.font = "10px Arial";
        ctx.fillStyle = "#FFD700";
        ctx.fillText(`State: ${this.state}`, this.x + this.width / 2, this.y - 8);
    }
    //
    //KUBOVA ROBOTKA
    //
    //Logika pre NPCS
    //

    //Wander - NPC sa bude nahodne pohybovat po okoli
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

    //ReturnHome - NPC sa vrati do svojho domu
    returnHome() {
        this.state = "Returning Home";
        this.x = (this.homeX * TILE_SIZE) + (TILE_SIZE / 2) - 10;
        this.y = (this.homeY * TILE_SIZE) + (TILE_SIZE / 2) - 15;
    }

    //Idle - NPC sa nebude pohybovat a bude stat na mieste
    idle() {
        this.state = "Idle";
    }

    //InHome - NPC sa nachadza v dome
    inHome() {
        this.state = "In Home";
        this.x = (this.homeX * TILE_SIZE) + (TILE_SIZE / 2) - 10;
        this.y = (this.homeY * TILE_SIZE) + (TILE_SIZE / 2) - 15;
        ctx.fillStyle = "transparent";
    }

}

//TODO: Dokoncit generovanie NPCS
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
        100, // health
        100, // hunger
        100,  // happiness
        workplaceX,
        workplaceY
    );

    //Pridelovanie pracoviska pre NPC
    //Peasant
    if (profession == "peasant") {
         if (activeFields.length > 0) {
            //Vybera nahodne pole z listu aktivnych poli a prideluje ho NPC ako pracovisko
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

//TODO: Dokoncit klikanie na NPCS - zobrazenie informacii o nich 
document.getElementById('gameCanvas').addEventListener('click', (e) => {
    // 1. Get canvas position on the page
    const rect = gameCanvas.getBoundingClientRect();
    
    // 2. Calculate mouse coordinates relative to the canvas
    // We use Math.floor to keep them aligned with pixel logic
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // 3. Define a "buffer" to make clicking easier (8px wide is very small)
    const clickBuffer = 10; 

    let npcFound = false;

    // 4. Iterate backwards through NPCs 
    // (This ensures we click the one "on top" if they are overlapping)
    for (let i = activeNPCs.length - 1; i >= 0; i--) {
        const npc = activeNPCs[i];

        // 5. Check if mouse is within the NPC's area + buffer
        const isInsideX = mouseX >= (npc.x - clickBuffer) && 
                          mouseX <= (npc.x + npc.width + clickBuffer);
                          
        const isInsideY = mouseY >= (npc.y - clickBuffer) && 
                          mouseY <= (npc.y + npc.height + clickBuffer);

        if (isInsideX && isInsideY) {
            console.log(`Selected NPC: ${npc.name}`);
            showNpcInfo(npc);
            npcFound = true;
            break; // Stop the loop once the first NPC is found
        }
    }

    // 6. Close the modal if the player clicks the empty ground
    if (!npcFound) {
        // Only close if the click wasn't on the modal itself 
        // (Handled automatically by z-index usually, but good practice)
        closeNpcInfo();
    }
});

//Updatovanie Citizens Listu v UI
function updateCitizensList(npcName) {
    const listItem = document.createElement("span");
    listItem.id = "stat-citizen-name";
    listItem.textContent = npcName;
    npcList.appendChild(listItem);
}

//TODO: Urobit jedonoduchu funkciu na "raycasting" pre zobrazovanie a vypocitanie vzdialenosti NPC od domu 
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
    // Show the modal
    const modal = document.getElementById('npc-info-modal');
    modal.style.display = 'flex';

    // Populate data from the NPC class
    document.getElementById('npc-info-name').innerText = npc.name;
    document.getElementById('npc-info-img').src = npc.img;
    document.getElementById('npc-info-profession').innerText = `Profession: ${npc.profession}`;
    document.getElementById('npc-info-state').innerText = `Status: ${npc.state}`;
    
    document.getElementById('npc-info-health').innerText = `${npc.health}/100`;
    document.getElementById('npc-info-hunger').innerText = npc.hunger;
    document.getElementById('npc-info-happiness').innerText = npc.happiness;
    
    const workText = (npc.workplaceX !== null) ? `At (${npc.workplaceX}, ${npc.workplaceY})` : "Unemployed";
    document.getElementById('npc-info-work').innerText = workText;
}

function closeNpcInfo() {
    document.getElementById('npc-info-modal').style.display = 'none';
}

function assignWork() {
    console.log("Logic for assigning work goes here...");
}
