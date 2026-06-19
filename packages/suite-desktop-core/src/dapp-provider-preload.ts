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
});

// Inject the provider into the page's main world. The preload runs before the
// page's own scripts, so `window.ethereum` exists by the time they do.
const script = document.createElement('script');
script.textContent = providerSource;
(document.head || document.documentElement).appendChild(script);
script.remove();

const postToPage = (message: unknown) => window.postMessage(message, '*');

const isProviderRequest = (data: unknown): data is ProviderRequestMessage =>
    typeof data === 'object' &&
    data !== null &&
    (data as ProviderRequestMessage).target === PROVIDER_MESSAGE_TARGET.REQUEST &&
    (data as ProviderRequestMessage).nonce === nonce;

// Bridge: main-world provider request → main process → response back to page.
window.addEventListener('message', async event => {
    if (event.source !== window || !isProviderRequest(event.data)) {
        return;
    }

    const { id, method, params } = event.data;

    const respond = (payload: { result?: unknown; error?: { code: number; message: string } }) =>
        postToPage({
            target: PROVIDER_MESSAGE_TARGET.INPAGE,
            nonce,
            kind: 'response',
            id,
            ...payload,
        });

    try {
        const outcome: ProviderResult = await ipcRenderer.invoke(DAPP_PROVIDER_IPC.REQUEST, {
            method,
            params,
        });

        respond(outcome.ok ? { result: outcome.result } : { error: outcome.error });
    } catch (error) {
        respond({
            error: {
                code: -32603,
                message: error instanceof Error ? error.message : 'Internal error',
            },
        });
    }
});

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
