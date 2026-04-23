let currentDay = 1;
let currentHour = 8; 
let currentMinute = 0;
let gameSpeed = 1000; 

function updateTime() {
    currentMinute += 10; 

    if (currentMinute >= 60) {
        currentMinute = 0;
        currentHour++;
    }

    if (currentHour >= 24) {
        currentHour = 0;
        currentDay++;
        
    }

    let formattedHour = currentHour < 10 ? "0" + currentHour : currentHour;
    let formattedMinute = currentMinute < 10 ? "0" + currentMinute : currentMinute;

    const dayEl = document.getElementById('day-text');
    const timeEl = document.getElementById('time-text');
    
    if (dayEl && timeEl) {
        dayEl.innerText = `Day ${currentDay}`;
        timeEl.innerText = `${formattedHour}:${formattedMinute}`;
    }
}

setInterval(updateTime, gameSpeed);
//n