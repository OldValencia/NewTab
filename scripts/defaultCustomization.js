let defaultCustomization = {};
let customizationLoaded = false;

const backgroundLayerNames = {
    stars: 'stars',
    blobFlow: 'blobFlow',
    nebulaDust: 'nebulaDust',
    glassGrid: 'glassGrid',
    orbitalRings: 'orbitalRings',
    particleDrift: 'particleDrift',
    cloudySpiral: 'cloudySpiral',
    solarSystem: 'solarSystem',
    waves: 'waves',
    fallingLines: 'fallingLines',
    floatingCircles: 'floatingCircles'
};

async function loadDefaultCustomizationSettings() {
    if (customizationLoaded) return;

    try {
        const res = await fetch('settings/default-customization.json');
        defaultCustomization = await res.json();
        customizationLoaded = true;
    } catch (err) {
        console.error('Failed to load default-customization.json:', err);
    }
}

async function getDefaultCustomizationByKey(key) {
    if (!customizationLoaded) {
        await loadDefaultCustomizationSettings();
    }

    return defaultCustomization[key] || null;
}
