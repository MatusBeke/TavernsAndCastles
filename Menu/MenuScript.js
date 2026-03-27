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
    }, 100);
}

function quitGame() {
    document.body.style.transition = "opacity 2s ease";
    document.body.style.opacity = "0";
    setTimeout(() => {
        window.close();
    }, 2000);
}