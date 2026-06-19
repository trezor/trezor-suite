// postMessage protocol between the injected main-world provider and the
// dApp-only preload (isolated world). Both worlds share the DOM, so
// `window.postMessage` is the bridge. Messages are namespaced by `target` so the
// dApp's own message traffic is ignored, and authenticated by a per-session
// `nonce` kept in the provider's closure (and known only to the preload), so the
// dApp page cannot spoof responses or events.
//
// NOTE (prod hardening): a transferred MessagePort would make the channel
// completely unobservable to the dApp; the nonce is the PoC-level mitigation.

export const PROVIDER_MESSAGE_TARGET = {
    /** main-world provider → preload (a request). */
    REQUEST: 'trezor-dapp-provider',
    /** preload → main-world provider (a response or event). */
    INPAGE: 'trezor-dapp-inpage',
} as const;

export type ProviderEventName =
    | 'connect'
    | 'disconnect'
    | 'accountsChanged'
    | 'chainChanged'
    | 'message';

export type ProviderRequestMessage = {
    target: typeof PROVIDER_MESSAGE_TARGET.REQUEST;
    nonce: string;
    id: number;
    method: string;
    params?: unknown;
};

export type ProviderResponseMessage = {
    target: typeof PROVIDER_MESSAGE_TARGET.INPAGE;
    nonce: string;
    kind: 'response';
    id: number;
    result?: unknown;
    error?: { code: number; message: string };
};

export type ProviderEventMessage = {
    target: typeof PROVIDER_MESSAGE_TARGET.INPAGE;
    nonce: string;
    kind: 'event';
    event: ProviderEventName;
    data?: unknown;
};

export type ProviderInpageMessage = ProviderResponseMessage | ProviderEventMessage;

/** Envelope a provider request resolves to (main process → preload). */
export type ProviderResult =
    | { ok: true; result: unknown }
    | { ok: false; error: { code: number; message: string } };
