// Event page: the toolbar button opens a new tab (which shows this extension's page).
browser.browserAction.onClicked.addListener(() => {
    browser.tabs.create({});
});
