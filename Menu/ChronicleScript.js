// Plynulý fade-in po načítaní stránky
window.onload = () => {
    document.body.style.opacity = "1";
};

function goBack() {
    // Plynulý fade-out pred návratom do menu
    document.body.style.opacity = "0";
    setTimeout(() => {
        window.location.href = "MenuIndex.html"; // Uprav cestu ak treba
    }, 1000);
}

// Logika pre toggle tlačidlo
const toggleBtns = document.querySelectorAll('.toggle-btn');
toggleBtns.forEach(btn => {
    btn.addEventListener('click', function() {
        if (this.innerText === "Off") {
            this.innerText = "On";
            this.style.background = "#d4af37";
            this.style.color = "#050201";
        } else {
            this.innerText = "Off";
            this.style.background = "transparent";
            this.style.color = "#d4af37";
        }
    });
});