import { type Eip6963ProviderInfo } from '../types';

// The EIP-1193 provider injected into the dApp's MAIN world. It is serialised
// with `.toString()` and evaluated in the page, so it must be fully
// self-contained: no imports, no closures over module scope, and no syntax that
// the bundler would rewrite with external helper functions. suite-desktop-core
// transpiles this file with `@babel/preset-typescript` (type-stripping only),
// so modern syntax is preserved verbatim and runs as-is in the dApp's Chromium
// — but object/array spread and async/await are avoided, since those are the
// constructs that pull in helpers under a stricter target.
//
// It talks to the preload over `window.postMessage` using the protocol in
// ./messages, authenticated by the per-session nonce.

export type InjectedProviderConfig = {
    nonce: string;
    info: Eip6963ProviderInfo;
    requestTarget: string;
    inpageTarget: string;
};

function injectedProvider(config: InjectedProviderConfig) {
    const { nonce } = config;
    const { info } = config;
    const REQUEST = config.requestTarget;
    const INPAGE = config.inpageTarget;

    let nextId = 1;
    const pending: any = {};
    const listeners: any = {};

    const emit = (event: string, data: any) => {
        const cbs = listeners[event];
        if (!cbs) return;
        cbs.slice().forEach((cb: any) => {
            try {
                cb(data);
            } catch {
                /* a faulty dApp listener must not break the provider */
            }
        });
    };

    window.addEventListener('message', (event: any) => {
        if (event.source !== window) return;
        const msg = event.data;
        if (msg?.target !== INPAGE || msg.nonce !== nonce) return;

        if (msg.kind === 'response') {
            const p = pending[msg.id];
            if (!p) return;
            delete pending[msg.id];
            if (msg.error) {
                const err: any = new Error(msg.error.message);
                err.code = msg.error.code;
                p.reject(err);
            } else {
                p.resolve(msg.result);
            }

            return;
        }

        if (msg.kind === 'event') {
            emit(msg.event, msg.data);
        }
    });

    const request = (args: any) =>
        new Promise((resolve, reject) => {
            if (!args || typeof args.method !== 'string') {
                const e: any = new Error('Invalid request arguments');
                e.code = -32602;
                reject(e);

                return;
            }
            const id = nextId++;
            pending[id] = { resolve, reject };
            window.postMessage(
                { target: REQUEST, nonce, id, method: args.method, params: args.params },
                '*',
            );
        });

    const provider: any = {
        isTrezor: true,
        isMetaMask: false,
        request,
        on(event: string, cb: any) {
            if (!listeners[event]) listeners[event] = [];
            listeners[event].push(cb);

            return provider;
        },
        removeListener(event: string, cb: any) {
            listeners[event] = (listeners[event] || []).filter((x: any) => x !== cb);

            return provider;
        },
        // Legacy compatibility shim used by older dApps.
        enable() {
            return request({ method: 'eth_requestAccounts' });
        },
    };

    try {
        Object.defineProperty(window, 'ethereum', {
            value: provider,
            configurable: false,
            writable: false,
        });
    } catch {
        (window as any).ethereum = provider;
    }

    // EIP-6963 multi-provider discovery.
    const announce = () => {
        window.dispatchEvent(
            new CustomEvent('eip6963:announceProvider', {
                detail: Object.freeze({ info, provider }),
            }),
        );
    };
    window.addEventListener('eip6963:requestProvider', announce);
    announce();

    // Establish the initial connection state for the dApp.
    request({ method: 'eth_chainId' })
        .then((chainId: any) => emit('connect', { chainId }))
        .catch(() => {});
}

/** A minimal Trezor-mark data URI (EIP-6963 requires the icon to be a data URI). */
export const DAPP_BROWSER_PROVIDER_ICON =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Crect width='24' height='24' rx='6' fill='%23231F20'/%3E%3C/svg%3E";

/**
 * Build the self-contained provider source to inject into the dApp main world.
 */
export const createInjectedProviderSource = (config: InjectedProviderConfig): string =>
    `(${injectedProvider.toString()})(${JSON.stringify(config)});`;
