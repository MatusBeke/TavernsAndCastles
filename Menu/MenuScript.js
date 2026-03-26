function startGame() {
    const menu = document.getElementById('main-menu');
    const overlay = document.querySelector('.fog-overlay');
    
    // Temný prechod - dvere do krčmy sa zatvárajú
    menu.style.transition = "all 1s cubic-bezier(0.5, 0, 0.1, 1)";
    menu.style.transform = "scale(1.5) rotate(-2deg)";
    menu.style.opacity = "0";
    menu.style.filter = "blur(10px) sepia(100%)";
    overlay.style.background = "#000";
    overlay.style.opacity = "1";
    
    setTimeout(() => {
        window.location.href = "../Main/index.html";
    }, 1200);
}

function openOptions() {
    alert("Otáčaš stránky starej kroniky...");
}

function quitGame() {
    if(confirm("Vyjdeš von do temnej a chladnej noci?")) {
        window.close();
    }
}