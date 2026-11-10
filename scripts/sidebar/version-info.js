import { t } from "../core/i18n.js";
import { createElement } from "../core/utils.js";

const PROJECT_LINKS = [
    { href: "https://github.com/OldValencia/NewTab", text: "GitHub" },
    { href: "https://buymeacoffee.com/oldvalencia", text: "BuyMeACoffee" },
    { href: "https://ko-fi.com/oldvalencia", text: "Ko-fi" }
];

export function initVersionInfo() {
    const container = document.getElementById("version-info");
    const version = browser.runtime.getManifest().version;

    container.replaceChildren(`${t("version_text_content")} ${version}`);
    for (const { href, text } of PROJECT_LINKS) {
        container.append(" | ", createElement("a", { text, attrs: { href, target: "_blank", rel: "noopener" } }));
    }
}
