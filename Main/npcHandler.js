var activeNPCs = [];

class NPC {
    constructor(id, name, profession, homeX, homeY, health, hunger, happiness) {
        this.id = id;
        this.name = name;
        this.profession = profession;
        this.homeX = homeX;
        this.homeY = homeY;
        
        this.x = (homeX * TILE_SIZE) + (TILE_SIZE / 2) - 10;
        this.y = (homeY * TILE_SIZE) + (TILE_SIZE / 2) - 15;
        
        this.width = 8;
        this.height = 16;
        
        this.health = health;
        this.hunger = hunger;
        this.happiness = happiness;
    }

    draw(ctx) {
        ctx.fillStyle = "red";
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
    }
    //
    //KUBOVA ROBOTKA
    //
    //Logika pre NPCS
    //

    //Wander - NPC sa bude nahodne pohybovat po okoli
    wander() {
        
    }
}

//TODO: Dokoncit generovanie NPCS
function createNPC(homeX, homeY, profession = "Villager") {
    var npc = new NPC(
        activeNPCs.length + 1, 
        `NPC${activeNPCs.length + 1}`, 
        profession, 
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
