function enableWavesBackground(settings) {
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

    const defs = document.createElementNS(svgNS, "defs");
    const path = document.createElementNS(svgNS, "path");
    path.setAttribute("id", "gentle-wave");
    path.setAttribute("d", "M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z");
    defs.appendChild(path);
    svg.appendChild(defs);

    const g = document.createElementNS(svgNS, "g");
    g.classList.add("parallax");

    const waveConfigs = [
        { y: "0", fill: hexToRgba(settings.bg.waves.firstWaveColor, 0.7) },
        { y: "3", fill: hexToRgba(settings.bg.waves.useOnlyFirstWaveColor ? settings.bg.waves.firstWaveColor : settings.bg.waves.secondWaveColor, 0.5) },
        { y: "5", fill: hexToRgba(settings.bg.waves.useOnlyFirstWaveColor ? settings.bg.waves.firstWaveColor :settings.bg.waves.thirdWaveColor, 0.3) },
        { y: "7", fill: settings.bg.waves.useOnlyFirstWaveColor ? settings.bg.waves.firstWaveColor : settings.bg.waves.fourthWaveColor }
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
    backgroundLayer.style.background = `linear-gradient(60deg, ${settings.bg.waves.leftBackgroundColor} 0%, ${settings.bg.waves.rightBackgroundColor} 100%)`;
}

async function enableWavesBackgroundWithProceduralControls(proceduralControls) {
    const settings = getBackgroundSettings();
    const leftBg = await createColorInput("procedural_controls_left_background_color_input", "bg-left-color", settings.bg.waves.leftBackgroundColor, "waves", "leftBackgroundColor", enableWavesBackground);
    const rightBg = await createColorInput("procedural_controls_right_background_color_input", "bg-right-color", settings.bg.waves.rightBackgroundColor, "waves", "rightBackgroundColor", enableWavesBackground);
    const w1 = await createColorInput("procedural_controls_first_wave_color_input", "bg-first-wave-color", settings.bg.waves.firstWaveColor, "waves", "firstWaveColor", enableWavesBackground);
    const w2 = await createColorInput("procedural_controls_second_wave_color_input", "bg-second-wave-color", settings.bg.waves.secondWaveColor, "waves", "secondWaveColor", enableWavesBackground);
    const w3 = await createColorInput("procedural_controls_third_wave_color_input", "bg-third-wave-color", settings.bg.waves.thirdWaveColor, "waves", "thirdWaveColor", enableWavesBackground);
    const w4 = await createColorInput("procedural_controls_fourth_wave_color_input", "bg-fourth-wave-color", settings.bg.waves.fourthWaveColor, "waves", "fourthWaveColor", enableWavesBackground);
    const onlyFirst = await createCheckbox("procedural_controls_use_only_first_wave_color_input", "bg-use-only-first-wave-color", settings.bg.waves.useOnlyFirstWaveColor, "waves", "useOnlyFirstWaveColor", enableWavesBackground);

    proceduralControls?.append(leftBg, rightBg, w1, w2, w3, w4, onlyFirst);
    enableWavesBackground(settings);
}
