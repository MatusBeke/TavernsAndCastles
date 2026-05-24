var activeNPCs = [];
const npcList = document.getElementById("citizens-list");

let jobs = ["peasant", "miner", "lumberman", "guard"];
let selectedNPC = null;
let isAbleToWork = true;

let peasantImage = "../Resources/NPCs/NPC_Peasant.png";
let minerImage = "../Resources/NPCs/NPC_Miner.png";
let lumbermanImage = "../Resources/NPCs/NPC_Lumberman.png";
let guardImage = "../Resources/NPCs/NPC_Guard.png";
let skeletonImage = "../Resources/NPCs/NPC_Skeleton.png";
let kingImage = "../Resources/NPCs/NPC_King.png";

const npcImages = {
    "peasant": new Image(),
    "miner": new Image(),
    "lumberman": new Image(),
    "guard": new Image(),
    "skeleton": new Image(),
    "king": new Image()
};

npcImages["peasant"].src = peasantImage;
npcImages["miner"].src = minerImage;
npcImages["lumberman"].src = lumbermanImage;
npcImages["guard"].src = guardImage;
npcImages["skeleton"].src = skeletonImage;
npcImages["king"].src = kingImage;

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

        // Aktuálna pozícia
        this.x = (homeX * TILE_SIZE) + (TILE_SIZE / 2) - 10;
        this.y = (homeY * TILE_SIZE) + (TILE_SIZE / 2) - 15;

        this.targetX = this.x;
        this.targetY = this.y;
        this.speed = 50; 

        this.width = 8;
        this.height = 16;

        this.health = health;
        this.hunger = hunger;
        this.happiness = happiness;

        this.workplaceX = workplaceX; 
        this.workplaceY = workplaceY;

        this.state = "Wandering";
        this.lastUpdate = Date.now();

        this.workTimer = 0;
    }

    update(deltaTime) {
        if (this.state === "Dead") {
            this.speed = 0;
            this.health = 0;
            this.hunger = 0;
            this.happiness = 0;
            this.img = skeletonImage;
            return;
        }

        const teraz = Date.now();

        if (teraz - this.lastUpdate > 1000) {
            //Znizovanie hladu podla cinnosti
            if (this.state === "Working") {
                this.hunger = Math.max(0, this.hunger - 2);
            } else if (this.state !== "In Home") {
                this.hunger = Math.max(0, this.hunger - 1);
            }

            //Ak hlad klesol na 0, NPC umrie
            if (this.hunger <= 0) {
                this.state = "Dead";
                this.health = 0;
                this.speed = 0;
                this.happiness = 0;
                console.log(`NPC ${this.name} práve zomrelo od hladu na pozadí!`);
                this.lastUpdate = teraz;
                return;
            }

            if ((currentHour === 7 || currentHour === 12 || currentHour === 18) && currentMinute === 0) {
                this.hunger = 100;
                currentFood -= 1;
                updateHUD();
            }

            if (currentHour >= 20 || currentHour < 6) {
                this.inHome();    
                // if (currentHour === 23 && currentMinute == 0)
                // {
                //     if (Math.random() < 0.25) 
                //     { 
                //         this.reproduce();
                //     }
                // }        
            } else if (currentHour >= 7 && currentHour < 17) {
                if (this.workplaceX !== null && this.workplaceY !== null && isAbleToWork == true) {
                    this.work();
                } else {
                    this.wander();
                }
            } else {
                if (this.state === "In Home") {
                    this.state = "Wandering";
                }
                this.wander();
            }

            this.lastUpdate = teraz;
        }
        this.moveToTarget(deltaTime);
    }

    // Pomocná metóda na plynulý presun k cieľu
    moveToTarget(deltaTime) {
        let dx = this.targetX - this.x;
        let dy = this.targetY - this.y;
        let distance = Math.sqrt(dx * dx + dy * dy);

        // Ak sme dostatočne blízko cieľa (menej ako 1 pixel), zastavíme sa na presnej pozícii
        if (distance < 1) {
            this.x = this.targetX;
            this.y = this.targetY;
            return;
        }

        // Vypočítame krok pre tento snímok na základe rýchlosti a času
        let step = this.speed * deltaTime;

        // Ak je krok väčší ako zostávajúca vzdialenosť, skočíme priamo do cieľa
        if (step >= distance) {
            this.x = this.targetX;
            this.y = this.targetY;
        } else {
            // Normalizácia vektora a posun o plynulý krok
            this.x += (dx / distance) * step;
            this.y += (dy / distance) * step;
        }
    }

    draw(ctx) {
        let npcImgAsset = npcImages[this.profession];

        if (this.state === "Dead") {
            npcImgAsset = npcImages["skeleton"];
        }

        if (npcImgAsset && npcImgAsset.complete && npcImgAsset.naturalWidth !== 0) {
            ctx.drawImage(npcImgAsset, this.x, this.y, this.width, this.height);
        } else {
            // Fallback rendering
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

        // Meno a stav nad hlavou NPC
        ctx.fillStyle = "white";     
        ctx.font = "bold 12px MedievalSharp"; 
        ctx.textAlign = "center"; 
        ctx.fillText(this.name, this.x + this.width / 2, this.y - 12);

        ctx.font = "10px MedievalSharp";
        ctx.fillStyle = "#FFD700";
        ctx.fillText(`State: ${this.state}`, this.x + this.width / 2, this.y - 2);
    }

    wander() {
        if (this.state !== "Dead") {
            this.state = "Wandering";
            const moveRange = 32; 

            let dx = (Math.random() * moveRange * 2) - moveRange;
            let dy = (Math.random() * moveRange * 2) - moveRange;

            let newTargetX = this.x + dx;
            let newTargetY = this.y + dy;

            this.targetX = Math.max(0, Math.min(newTargetX, MAP_SIZE * TILE_SIZE));
            this.targetY = Math.max(0, Math.min(newTargetY, MAP_SIZE * TILE_SIZE));
        }
    }

    returnHome() {
        this.state = "Returning Home";
        this.targetX = (this.homeX * TILE_SIZE) + (TILE_SIZE / 2) - 10;
        this.targetY = (this.homeY * TILE_SIZE) + (TILE_SIZE / 2) - 15;
    }

    idle() {
        this.state = "Idle";
    }

    inHome() {
        if (this.state !== "Dead") {
            this.state = "In Home";
            this.targetX = (this.homeX * TILE_SIZE) + (TILE_SIZE / 2) - 10;
            this.targetY = (this.homeY * TILE_SIZE) + (TILE_SIZE / 2) - 15;
        }
    }

    work() {
        if (this.state !== "Dead" && isAbleToWork == true) {
            this.state = "Working";
            const randomOffsetX = Math.random() * (TILE_SIZE - 20);
            const randomOffsetY = Math.random() * (TILE_SIZE - 20);

            if (this.workplaceX !== null && this.workplaceY !== null) {
                this.targetX = (this.workplaceX * TILE_SIZE) + randomOffsetX;
                this.targetY = (this.workplaceY * TILE_SIZE) + randomOffsetY;
            }

            if (this.profession === "peasant") {
                this.workTimer += 1;

                if (this.workTimer >= 5) {
                    currentFood += 1;
                    this.happiness = Math.min(100, this.happiness + 1);

                    // Správne zobrazenie plávajúceho textu
                    if (typeof spawnFloatingText === 'function') {
                        spawnFloatingText("+1 Food", this.workplaceX, this.workplaceY, "#d9ff00");
                    }

                    updateHUD();
                    this.workTimer = 0; 
                }
            } else if (this.profession === "lumberman") {
                this.workTimer += 1;

                if (this.workTimer >= 5) {
                    currentWood += 1;
                    this.happiness = Math.min(100, this.happiness + 1);
                    
                    // Správne zobrazenie plávajúceho textu
                    if (typeof spawnFloatingText === 'function') {
                        spawnFloatingText("+1 Wood", this.workplaceX, this.workplaceY, "#d9ff00");
                    }
                    
                    updateHUD();
                    this.workTimer = 0; 
                }
            } else if (this.profession === "guard") {
                this.workTimer += 1;

                if (this.workTimer >= 5) {
                    currentTrainingPoints += 1;
                    this.happiness = Math.min(100, this.happiness + 1);
                    
                    // Správne zobrazenie plávajúceho textu
                    if (typeof spawnFloatingText === 'function') {
                        spawnFloatingText("+1 Training Point", this.workplaceX, this.workplaceY, "#3378b8");
                    }
                    
                    updateHUD();
                    this.workTimer = 0; 
                }
            } else if (this.profession === "miner") {
                this.workTimer += 1;

                if (this.workTimer >= 5) {
                    currentStone += 1;
                    this.happiness = Math.min(100, this.happiness + 1);
                    
                    if (typeof spawnFloatingText === 'function') {
                        spawnFloatingText("+1 Stone", this.workplaceX, this.workplaceY, "#3378b8");
                    }

                    // 70% šanca na uhlie (+1 Coal)
                    if (Math.random() < 0.7) {
                        currentCoal += 1;
                        if (typeof spawnFloatingText === 'function') {
                            spawnFloatingText("+1 Coal", this.workplaceX, this.workplaceY - 20, "#555555");
                        }
                    }

                    // 40% šanca na železo (+1 Iron)
                    if (Math.random() < 0.4) {
                        currentIron += 1; 
                        if (typeof spawnFloatingText === 'function') {
                            spawnFloatingText("+1 Iron", this.workplaceX, this.workplaceY - 40, "#d47a2a");
                        }
                    }
                    
                    updateHUD();
                    this.workTimer = 0; 
                }
            }
        }
    }

    reproduce() {
        this.state = "Reproducing";
        this.targetX = (this.homeX * TILE_SIZE) + (TILE_SIZE / 2) - 10;
        this.targetY = (this.homeY * TILE_SIZE) + (TILE_SIZE / 2) - 15;
        this.happiness += 1;
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

    let hungerState = "Full";
    if (npc.hunger <= 0) {
        hungerState = "Dead";
    } else if (npc.hunger < 30) {
        hungerState = "Starving"; 
    } else if (npc.hunger < 70) {
        hungerState = "Hungry";
    }

    document.getElementById('npc-info-name').innerText = npc.name;
    document.getElementById('npc-info-state').innerText = `State: ${npc.state}`;
    document.getElementById('npc-info-health').innerText = `${npc.health}/100`;
    document.getElementById('npc-info-hunger').innerText = `${npc.hunger}/100 (${hungerState})`;
    document.getElementById('npc-info-happiness').innerText = `${npc.happiness}/100`;

    // --- DROPDOWN POPULATION ---
    const jobDropdown = document.getElementById('npc-info-profession-select');
    if (jobDropdown) {
        jobDropdown.innerHTML = ''; // Clear previous selections

        // Loop through your existing global 'jobs' array
        jobs.forEach(job => {
            const option = document.createElement('option');
            option.value = job;
            // Capitalize the first letter for clean styling (e.g., "miner" -> "Miner")
            option.textContent = job.charAt(0).toUpperCase() + job.slice(1); 

            // Highlight the NPC's actual current profession
            if (job === npc.profession) {
                option.selected = true;
            }
            jobDropdown.appendChild(option);
        });
    }

    //Kontrola ci sa pracovisko nachadza v 20 tilovom radiuse od domu
    let distanceFromHome = 0;
    let distanceText = "";

    if (npc.workplaceX !== null && npc.workplaceY !== null) {
        let dx = npc.workplaceX - npc.homeX;
        let dy = npc.workplaceY - npc.homeY;

        distanceFromHome = parseFloat(Math.sqrt(dx * dx + dy * dy).toFixed(0));
        distanceText = distanceFromHome.toString();
        isAbleToWork = distanceFromHome <= 20;
        console.log("Moze pracovat.")
    } else {
        isAbleToWork = false; 
        distanceFromHome = 0;
        distanceText = "Workplace too far away! - " + distanceFromHome.toString()
        console.log("Nemoze pracovat.")
    }

    const workText = (npc.workplaceX !== null) ? `Workplace: [${npc.workplaceX}, ${npc.workplaceY}] (${distanceText})` : "Unemployed";
    document.getElementById('npc-info-work').innerText = workText;

    const homeText = (npc.homeX !== null) ? `Home: [${npc.homeX}, ${npc.homeY}]` : "Homeless";
    document.getElementById('npc-info-home').innerText = homeText;

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
    } else if (profession === "lumberman") {
        if (typeof activeLumberyards !== 'undefined' && activeLumberyards.length > 0) {
            const lumberyard = activeLumberyards[Math.floor(Math.random() * activeLumberyards.length)];
            let [x, y] = lumberyard.split(',').map(Number);
            npc.workplaceX = x;
            npc.workplaceY = y;
        }
    } else if (profession === "miner") {
        if (typeof activeMines !== 'undefined' && activeMines.length > 0) {
            const mine = activeMines[Math.floor(Math.random() * activeMines.length)];
            let [x, y] = mine.split(',').map(Number);
            npc.workplaceX = x;
            npc.workplaceY = y;
        }
    } else if (profession === "guard") {
        if (typeof activeBarracks !== 'undefined' && activeBarracks.length > 0) {
            const barracks = activeBarracks[Math.floor(Math.random() * activeBarracks.length)];
            let [x, y] = barracks.split(',').map(Number);
            npc.workplaceX = x;
            npc.workplaceY = y;
        }
    }

    showNpcInfo(npc);
}

function changeWork() {
    // Drop execution immediately if the target NPC is invalid or dead
    if (!selectedNPC || selectedNPC.state === "Dead") return;

    const jobDropdown = document.getElementById('npc-info-profession-select');
    if (!jobDropdown) return;

    const chosenJob = jobDropdown.value;
    selectedNPC.profession = chosenJob;

    if (chosenJob === "peasant") selectedNPC.img = peasantImage;
    else if (chosenJob === "miner") selectedNPC.img = minerImage;
    else if (chosenJob === "lumberman") selectedNPC.img = lumbermanImage;
    else if (chosenJob === "guard") selectedNPC.img = guardImage;

    assignWork();
    console.log(`Changed ${selectedNPC.name}'s job to: ${chosenJob}`);
}

// Pomocná funkcia na nájdenie nového domu po predaji
function relocateNPCHomeAfterSell(npc, soldX, soldY) {
    let closestHome = null;
    let minDistance = Infinity;

    // Prejdeme celú mapu a hľadáme obytné budovy
    for (let y = 0; y < MAP_SIZE; y++) {
        for (let x = 0; x < MAP_SIZE; x++) {
            const tile = mapData[y][x];

            if (tile && tile.buildingSrc) {
                const src = tile.buildingSrc.toLowerCase();
                // Overíme, či ide o obytnú budovu (Cabin, House) a či to nie je tá, ktorú práve búrame
                if ((src.includes('cabin') || src.includes('house')) && !(x === soldX && y === soldY)) {
                    let dx = x - soldX;
                    let dy = y - soldY;
                    let distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < minDistance) {
                        minDistance = distance;
                        closestHome = { x, y };
                    }
                }
            }
        }
    }

    if (closestHome) {
        npc.homeX = closestHome.x;
        npc.homeY = closestHome.y;
        console.log(`NPC ${npc.name} sa úspešne presťahoval na [${npc.homeX}, ${npc.homeY}]`);
    } else {
        npc.homeX = null;
        npc.homeY = null;
        if (npc.state) npc.state = "Wandering"; 
        console.log(`NPC ${npc.name} nenašiel voľné ubytovanie.`);
    }
}

// Pomocná funkcia na nájdenie novej práce po predaji
function relocateNPCWorkplaceAfterSell(npc) {
    let targetArray = [];

    // Priradíme správne pole podľa profesie NPC
    if (npc.profession === "peasant") targetArray = activeFields;
    else if (npc.profession === "lumberman") targetArray = activeLumberyards;
    else if (npc.profession === "miner") targetArray = activeMines;
    else if (npc.profession === "guard") targetArray = activeBarracks;
    else if (npc.profession === "quarryman") targetArray = activeQuarries; // Pridané pre lomy

    let closestWork = null;
    let minDistance = Infinity;

    // Kedže v poliach máš stringy "x,y", musíme ich naparsovať
    targetArray.forEach(coordsStr => {
        let [x, y] = coordsStr.split(',').map(Number);

        let dx = x - npc.workplaceX;
        let dy = y - npc.workplaceY;
        let distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < minDistance) {
            minDistance = distance;
            closestWork = { x, y };
        }
    });

    if (closestWork) {
        npc.workplaceX = closestWork.x;
        npc.workplaceY = closestWork.y;
        console.log(`NPC ${npc.name} si našiel novú prácu na [${npc.workplaceX}, ${npc.workplaceY}]`);
    } else {
        npc.workplaceX = null;
        npc.workplaceY = null;
        console.log(`NPC ${npc.name} je momentálne nezamestnaný.`);
    }
}