let defaultCustomization = {};

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
    try {
        const res = await fetch('settings/default-customization.json');
        defaultCustomization = await res.json();
    } catch (err) {
        console.error('Failed to load default-customization.json:', err);
    }
}

async function getDefaultCustomizationByKey(key) {
    if (!defaultCustomization || Object.keys(defaultCustomization).length === 0) {
        await loadDefaultCustomizationSettings()
    }

    let text = defaultCustomization[key];
    if (text == null) {
        return null;
    }

    return text;
}
