/*
* Background color
* Line color
* Drop color
* */

function enableFallingLinesBackground() {
    cleanupBeforeEnableBackground();

    const wrapper = document.createElement("div");
    wrapper.className = "lines";

    for (let i = 0; i < 3; i++) {
        const line = document.createElement("div");
        line.className = "line";

        // Смещение для первой и третьей линии
        if (i === 0) {
            line.style.marginLeft = "-25%";
        } else if (i === 2) {
            line.style.marginLeft = "25%";
        }

        const drop = document.createElement("div");
        drop.style.position = "absolute";
        drop.style.content = '""';
        drop.style.display = "block";
        drop.style.height = "15vh";
        drop.style.width = "100%";
        drop.style.top = "-50%";
        drop.style.left = "0";
        drop.style.background = "linear-gradient(to bottom, rgba(255, 255, 255, 0) 0%, #ffffff 75%, #ffffff 100%)";
        drop.style.animation = "drop 7s infinite forwards";
        drop.style.animationTimingFunction = "cubic-bezier(0.4, 0.26, 0, 0.97)";

        // Задержка для первой и третьей
        if (i === 0) {
            drop.style.animationDelay = "2s";
        } else if (i === 2) {
            drop.style.animationDelay = "2.5s";
        }

        line.appendChild(drop);
        wrapper.appendChild(line);
    }

    backgroundLayer.appendChild(wrapper);
    backgroundLayer.style.backgroundColor = "#171717";
}
