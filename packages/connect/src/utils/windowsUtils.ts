// send message from iframe to parent
export const sendMessage = (message: any, origin: string) =>
    window.parent.postMessage(message, origin);

// send message from popup to parent
export const sendMessageToOpener = (message: any, origin: string) => {
    if (window.opener) {
        return window.opener.postMessage(message, origin);
    }
    // webextensions are expecting this message in "content-script" which is running in "this.window", above this script
    window.postMessage(message, window.location.origin);
};

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
