// origin: https://github.com/trezor/connect/blob/develop/src/js/utils/windowsUtils.

// send message from iframe to parent
export const sendMessage = (message: any, origin: string) =>
    window.parent.postMessage(message, origin);

// browser built-in functionality to quickly and safely escape the string
export const escapeHtml = (payload: any) => {
    if (!payload) return;
    try {
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(JSON.stringify(payload)));
        return JSON.parse(div.innerHTML);
    } catch (error) {
        // do nothing
    }
};
