const toggleTime = document.getElementById("toggle-time");
const toggleDate = document.getElementById("toggle-date");
const timeElement = document.getElementById("time");
const dateElement = document.getElementById("date");
const defaultTimeAndDateFont = "Arial";
const defaultTimeColor = "#7e4600";
const defaultDateColor = "#aaa";

function updateTime() {
    const now = new Date();

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

    timeElement.textContent = `${hours}:${minutes}`;
    dateElement.textContent = `${monthName} ${day} ${year}`;
    dateElement.setAttribute("data-tooltip", `${day}-${monthNum}-${year}`);
}

function resetShowAndTimeSettings() {
    localStorage.setItem("showTime", true);
    localStorage.setItem("showDate", true);
}

updateTime();
setInterval(updateTime, 60000);

document.addEventListener("DOMContentLoaded", () => {
    const showTime = localStorage.getItem("showTime");
    const showDate = localStorage.getItem("showDate");

    if (showTime !== null) {
        const visible = showTime === "true";
        toggleTime.checked = visible;
        timeElement.style.display = visible ? "block" : "none";
    }

    if (showDate !== null) {
        const visible = showDate === "true";
        toggleDate.checked = visible;
        dateElement.style.display = visible ? "block" : "none";
    }

    toggleTime.addEventListener("change", () => {
        const visible = toggleTime.checked;
        timeElement.style.display = visible ? "block" : "none";
        localStorage.setItem("showTime", visible);
    });

    toggleDate.addEventListener("change", () => {
        const visible = toggleDate.checked;
        dateElement.style.display = visible ? "block" : "none";
        localStorage.setItem("showDate", visible);
    });
});
