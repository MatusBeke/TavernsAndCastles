window.onload = () => {
    document.body.style.opacity = "1";
};

function selectBattleType(type) {
    console.log("Starting battle mode: " + type);
}

// Návrat na hlavnú mapu
function goBack() {
    document.body.style.opacity = "0";
    setTimeout(() => {
        window.location.href = "../Main/index.html"; 
    }, 1000);
}