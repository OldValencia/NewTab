/**
 * In-page replacements for window.confirm / window.alert, using #confirm-modal.
 */
import { t } from "./i18n.js";

const modal = document.getElementById("confirm-modal");
const messageElement = document.getElementById("confirm-message");
const yesButton = document.getElementById("confirm-yes");
const noButton = document.getElementById("confirm-no");

let closeCurrent = null;

export function isDialogOpen() {
    return closeCurrent !== null;
}

function openDialog(message, { yesText, noText }) {
    closeCurrent?.(false);

    messageElement.textContent = message;
    yesButton.textContent = yesText;
    noButton.textContent = noText ?? "";
    noButton.hidden = !noText;
    modal.classList.remove("hidden");
    yesButton.focus();

    return new Promise(resolve => {
        const close = answer => {
            modal.classList.add("hidden");
            yesButton.removeEventListener("click", onYes);
            noButton.removeEventListener("click", onNo);
            document.removeEventListener("keydown", onKeyDown, true);
            closeCurrent = null;
            resolve(answer);
        };
        const onYes = () => close(true);
        const onNo = () => close(false);
        const onKeyDown = event => {
            if (event.key === "Escape") {
                event.preventDefault();
                close(false);
            } else if (event.key === "Enter" && !modal.contains(event.target)) {
                // A focused dialog button handles Enter itself (so Enter on "No" means no).
                event.preventDefault();
                close(true);
            }
        };

        yesButton.addEventListener("click", onYes);
        noButton.addEventListener("click", onNo);
        document.addEventListener("keydown", onKeyDown, true);
        closeCurrent = close;
    });
}

/** Resolves to true when the user confirms. */
export function confirmDialog(message) {
    return openDialog(message, { yesText: t("modal_confirm_yes_button_html_default"), noText: t("modal_confirm_no_button_html_default") });
}

/** Shows a message with a single OK button. */
export function messageDialog(message) {
    return openDialog(message, { yesText: t("dialog_ok_button") });
}
