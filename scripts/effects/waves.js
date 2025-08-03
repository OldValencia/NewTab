/* Wave color
Background color
* */

function enableWavesBackground() {
    cleanupBeforeEnableBackground();

    const innerHeader = document.createElement("div");
    innerHeader.className = "inner-header flex";
    backgroundLayer.appendChild(innerHeader);

    const svgNS = "http://www.w3.org/2000/svg";
    const xlinkNS = "http://www.w3.org/1999/xlink";

    const svg = document.createElementNS(svgNS, "svg");
    svg.classList.add("waves");
    svg.setAttribute("xmlns", svgNS);
    svg.setAttribute("xmlns:xlink", xlinkNS);
    svg.setAttribute("viewBox", "0 24 150 28");
    svg.setAttribute("preserveAspectRatio", "none");
    svg.setAttribute("shape-rendering", "auto");

    // <defs>
    const defs = document.createElementNS(svgNS, "defs");
    const path = document.createElementNS(svgNS, "path");
    path.setAttribute("id", "gentle-wave");
    path.setAttribute("d", "M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z");
    defs.appendChild(path);
    svg.appendChild(defs);

    // <g class="parallax">
    const g = document.createElementNS(svgNS, "g");
    g.classList.add("parallax");

    const waveConfigs = [
        { y: "0", fill: "rgba(255,255,255,0.7)" },
        { y: "3", fill: "rgba(255,255,255,0.5)" },
        { y: "5", fill: "rgba(255,255,255,0.3)" },
        { y: "7", fill: "#fff" }
    ];

    waveConfigs.forEach(config => {
        const use = document.createElementNS(svgNS, "use");
        use.setAttributeNS(xlinkNS, "xlink:href", "#gentle-wave");
        use.setAttribute("x", "48");
        use.setAttribute("y", config.y);
        use.setAttribute("fill", config.fill);
        g.appendChild(use);
    });

    svg.appendChild(g);

    backgroundLayer.appendChild(svg);
    backgroundLayer.style.background = "linear-gradient(60deg, rgba(84,58,183,1) 0%, rgba(0,172,193,1) 100%)";
}
