const copyHomepageUrlBtn = document.getElementById('copy-homepage-url');
const homepageUrlInput = document.getElementById('homepage-url-input');

document.addEventListener("DOMContentLoaded", () => {
    const extensionUrl = browser.runtime.getURL("index.html") || "https://example.com";

    homepageUrlInput.value = extensionUrl;

    homepageUrlInput.addEventListener("click", () => {
        homepageUrlInput.select();
    });

    copyHomepageUrlBtn.addEventListener("click", () => {
        navigator.clipboard.writeText(extensionUrl)
            .then(() => {
                copyHomepageUrlBtn.textContent = "Copied!";
                setTimeout(() => {
                    copyHomepageUrlBtn.textContent = "Copy URL";
                }, 2000);
            })
            .catch(err => {
                console.error("Error:", err);
                copyHomepageUrlBtn.textContent = "Error 😢";
            });
    });
});
