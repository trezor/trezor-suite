/**
 * dApp-only preload (M2). Runs in the isolated world of the dApp
 * `WebContentsView`. It injects the EIP-1193 provider into the page's MAIN world
 * and bridges the provider's `postMessage` traffic to the main process over a
 * narrow, dApp-only IPC channel. It exposes NO `desktopApi` and no Connect proxy
 * — the dApp can only reach the classified RPC router.
 */
import { ipcRenderer } from 'electron';

import {
    DAPP_BROWSER_PROVIDER_ICON,
    DAPP_BROWSER_PROVIDER_INFO,
    DAPP_PROVIDER_IPC,
    PROVIDER_MESSAGE_TARGET,
    type ProviderRequestMessage,
    type ProviderResult,
    createInjectedProviderSource,
} from '@suite/dapp-browser';

// Per-session secret shared only with the injected provider (kept in its
// closure), so the dApp page cannot forge responses/events on the shared bus.
const nonce = crypto.randomUUID();

const providerSource = createInjectedProviderSource({
    nonce,
    info: {
        uuid: crypto.randomUUID(),
        name: DAPP_BROWSER_PROVIDER_INFO.name,
        rdns: DAPP_BROWSER_PROVIDER_INFO.rdns,
        icon: DAPP_BROWSER_PROVIDER_ICON,
    },
    requestTarget: PROVIDER_MESSAGE_TARGET.REQUEST,
    inpageTarget: PROVIDER_MESSAGE_TARGET.INPAGE,
    // Temporary: trace provider discovery/connection into the dApp console
    // (forwarded to Suite's `dapp-browser/console` log) to diagnose connection.
    debug: true,
});

// Inject the provider into the page's MAIN world before the page's own scripts
// run, so `window.ethereum` exists by the time they do. A sandboxed preload can
// execute before <html> is parsed (document.documentElement is null then), so
// guard the container and, if it isn't there yet, inject the instant it appears
// — still ahead of the page's scripts.
const injectProvider = () => {
    const container = document.head || document.documentElement;

    if (!container) {
        return false;
    }

    const script = document.createElement('script');
    script.textContent = providerSource;
    container.prepend(script);

    return true;
};

if (!injectProvider()) {
    const observer = new MutationObserver(() => {
        if (injectProvider()) {
            observer.disconnect();
        }
    });
    observer.observe(document, { childList: true, subtree: true });
}

const postToPage = (message: unknown) => window.postMessage(message, '*');

const isProviderRequest = (data: unknown): data is ProviderRequestMessage =>
    typeof data === 'object' &&
    data !== null &&
    (data as ProviderRequestMessage).target === PROVIDER_MESSAGE_TARGET.REQUEST &&
    (data as ProviderRequestMessage).nonce === nonce;

// Bridge: main-world provider request → main process. Fire-and-forget `send`
// (not `invoke`): the host replies on the RESPONSE channel via the WebContents,
// so a reply that arrives after the dApp frame navigated/reloaded never indexes
// a destroyed frame. The page-side request id is the correlation key.
window.addEventListener('message', event => {
    if (event.source !== window || !isProviderRequest(event.data)) {
        return;
    }

    const { id, method, params } = event.data;
    ipcRenderer.send(DAPP_PROVIDER_IPC.REQUEST, { requestId: id, method, params });
});

// Relay request responses main → page, matched to the page-side request id.
ipcRenderer.on(
    DAPP_PROVIDER_IPC.RESPONSE,
    (_event, payload: { requestId: number; outcome: ProviderResult }) => {
        const { requestId, outcome } = payload;
        postToPage({
            target: PROVIDER_MESSAGE_TARGET.INPAGE,
            nonce,
            kind: 'response',
            id: requestId,
            ...(outcome.ok ? { result: outcome.result } : { error: outcome.error }),
        });
    },
);

// Relay provider events (accountsChanged / chainChanged / …) main → page.
ipcRenderer.on(DAPP_PROVIDER_IPC.EVENT, (_event, payload: { event: string; data?: unknown }) => {
    postToPage({
        target: PROVIDER_MESSAGE_TARGET.INPAGE,
        nonce,
        kind: 'event',
        event: payload.event,
        data: payload.data,
    });
});
