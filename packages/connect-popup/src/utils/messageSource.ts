export const isFromContentScript = (event: MessageEvent, win: Window = window) =>
    event.source === win && event.origin === win.location.origin;

export const isFromOpener = (event: MessageEvent, win: Window = window) =>
    !!win.opener && event.source === win.opener;
