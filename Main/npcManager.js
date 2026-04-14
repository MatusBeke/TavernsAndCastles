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

