var activeNPCs = [];

class NPC {
    constructor(id, name, profession, img, homeX, homeY, health, hunger, happiness) {
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

        this.state = "Wandering";

        setInterval(this.wander.bind(this), 1000);
    }

    //Vykreslenie NPC
    draw(ctx) {
        ctx.fillStyle = "red";
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);

        ctx.fillStyle = "white";     
        ctx.font = "bold 12px Arial"; 
        ctx.textAlign = "center"; 
        ctx.fontFamily = "Arial"; //TODO: Pridat vlastny font 
        
        ctx.fillText(`${this.name} (${this.profession})`, this.x + this.width / 2, this.y - 20);
        
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
function createNPC(homeX, homeY, profession = "Villager", img = null) {
    var npc = new NPC(
        activeNPCs.length + 1, 
        `NPC${activeNPCs.length + 1}`, 
        profession,  
        img,
        homeX, 
        homeY, 
        100, 
        100, 
        100
    );
    activeNPCs.push(npc);
}

function shouldSpawnNPC(buildingSrc) {
    const src = buildingSrc.toLowerCase();
    return src.includes('cabin') || src.includes('house');
}

function debugListNPCs() {
    activeNPCs.forEach(npc => npc.identify());
}
