const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('mousedown', (e) => {
    isDragging = true;
    lastMousePos = { x: e.clientX, y: e.clientY };
});

window.addEventListener('mousemove', (e) => {
    if (isDragging) {
        const dx = e.clientX - lastMousePos.x;
        const dy = e.clientY - lastMousePos.y;

        camera.x += dx;
        camera.y += dy;

        lastMousePos = { x: e.clientX, y: e.clientY };
    }
});

window.addEventListener('mouseup', () => {
    isDragging = false;
});
window.addEventListener('resize', resize);
resize();

function update() {
}

let camera = { x: 0, y: 0 };
let isDragging = false;
let lastMousePos = { x: 0, y: 0 };

const WORLD_SIZE = 3000;

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save(); 
    ctx.translate(camera.x, camera.y); 

    ctx.fillStyle = "#4a773c";
    ctx.fillRect(0, 0, WORLD_SIZE, WORLD_SIZE);

    ctx.strokeStyle = "rgba(0,0,0,0.1)";
    for(let i = 0; i <= WORLD_SIZE; i += 50) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, WORLD_SIZE); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(WORLD_SIZE, i); ctx.stroke();
    }

    ctx.fillStyle = "#777";
    ctx.fillRect(500, 500, 150, 150); 

    ctx.restore();
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

loop();