
function startGame() {
    document.body.style.transition = "opacity 1.5s ease, filter 1.5s ease";
    document.body.style.opacity = "0";
    document.body.style.filter = "brightness(0.3) blur(10px) sepia(50%)";
    
    setTimeout(() => {
        window.location.href = "../Main/index.html";
    }, 1500);
}

function openOptions() {
    const content = document.querySelector('.nav-container');
    content.style.transition = "transform 0.1s ease";
    content.style.transform = "translateX(-10px)";
    
    setTimeout(() => { 
        content.style.transform = "translateX(0)"; 
        
        document.body.style.transition = "opacity 1s ease";
        document.body.style.opacity = "0";
        
        setTimeout(() => {
            window.location.href = "Chronicle.html";
        }, 1000);

    }, 100);
}

function quitGame() {
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.backgroundColor = '#000';
    overlay.style.display = 'flex';
    overlay.style.flexDirection = 'column';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.zIndex = '9999';
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 1.5s ease';
    
    overlay.innerHTML = `
        <div style="font-family: 'MedievalSharp', cursive; font-size: 8rem; color: #8b0000; text-shadow: 0 0 30px #ff0000; margin-bottom: 20px;">FUCK YOU</div>
        <div style="font-family: 'MedievalSharp', cursive; font-size: 2.5rem; color: #d4af37;">Are you really not closing with the window X?</div>
    `;

    document.body.appendChild(overlay);

    setTimeout(() => {
        overlay.style.opacity = '1';
    }, 50);

    setTimeout(() => {
        // 1. Najagresívnejší pokus zavrieť okno (Funguje v desktopových apkách)
        window.open('', '_self', '');
        window.close();
        
        // 2. Ak to prehliadač zablokuje, hra sa úplne "zabije" a ostane len prázdna čierna tma
        document.documentElement.innerHTML = "";
        document.documentElement.style.backgroundColor = "black";
        window.location.replace("about:blank");
    }, 4000);
}