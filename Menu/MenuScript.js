function startGame() {
    // Elegantný fade-out celej obrazovky
    document.body.style.transition = "opacity 1.2s ease";
    document.body.style.opacity = "0";
    
    setTimeout(() => {
        window.location.href = "../Main/index.html";
    }, 1200);
}

function openOptions() {
    console.log("Otváram kroniku...");
}

function quitGame() {
    if(confirm("Naozaj chceš opustiť hru?")) {
        window.close();
    }
}