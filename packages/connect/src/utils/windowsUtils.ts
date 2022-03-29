// origin: https://github.com/trezor/connect/blob/develop/src/js/utils/windowsUtils.

// send message from iframe to parent
export const sendMessage = (message: any, origin: string) =>
    window.parent.postMessage(message, origin);
