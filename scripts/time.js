function updateTime() {
    const now = new Date();
    const timeElem = document.getElementById("time");
    const dateElem = document.getElementById("date");

    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const year = now.getFullYear();
    const monthIndex = now.getMonth();
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const monthName = monthNames[monthIndex];
    const monthNum = (monthIndex + 1).toString().padStart(2, '0');

    timeElem.textContent = `${hours}:${minutes}`;
    dateElem.textContent = `${monthName} ${day} ${year}`;
    dateElem.setAttribute("data-tooltip", `${day}-${monthNum}-${year}`);
}

updateTime();
setInterval(updateTime, 60000);