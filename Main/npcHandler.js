var activeNPCs = [];

class NPC{
    constructor(id, name, profession, homeX, homeY, health, hunger, happiness) {
        this.id = id;
        this.name = name;
        this.profession = profession;
        this.homeX = homeX;
        this.homeY = homeY;
        this.health = health;
        this.hunger = hunger;
        this.happiness = happiness;
    }

    identify() {
        console.log(`NPC ID: ${this.id}, Name: ${this.name}, Profession: ${this.profession}, Home: (${this.homeX}, ${this.homeY})`);
    }
}

//TODO: Dokoncit generovanie NPCS
function createNPC(homeX, homeY) {
    var npc = new NPC(
        activeNPCs.length + 1, 
        `NPC${activeNPCs.length + 1}`, 
        "Villager", 
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
