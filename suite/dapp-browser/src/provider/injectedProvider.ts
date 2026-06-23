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
    /** When true, emit verbose provider-lifecycle tracing to the page console. */
    debug?: boolean;
};

function injectedProvider(config: InjectedProviderConfig) {
    const { nonce } = config;
    const { info } = config;
    const REQUEST = config.requestTarget;
    const INPAGE = config.inpageTarget;
    const debug = config.debug === true;

    let nextId = 1;
    const pending: any = {};
    const listeners: any = {};

    // Verbose tracing for debugging discovery/connection.
    // It surfaces in Suite's `dapp-browser/console` log group, tagged per dApp.
    const trace = (...args: unknown[]) => {
        if (debug) {
            // eslint-disable-next-line no-console
            console.trace('[trezor-provider]', ...args);
        }
    };

    // Generate a UUID (native crypto.randomUUID when available, else a v4
    // fallback for older engines).
    const makeUuid = () => {
        if (typeof crypto !== 'undefined' && (crypto as any).randomUUID) {
            return (crypto as any).randomUUID();
        }

        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c: string) => {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;

            return v.toString(16);
        });
    };

    // One stable uuid for this page load. EIP-6963 lets a wallet keep a single
    // uuid across announcements; mipd's raw store dedupes by uuid, so reusing it
    // yields exactly one Trezor entry no matter how many times we re-announce. A
    // rotating uuid (the previous approach) is harmless under wagmi's rdns dedup
    // but renders as duplicate wallets in any uuid-keyed picker.
    const sessionUuid = makeUuid();

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

        if (msg?.target !== INPAGE || msg.nonce !== nonce) {
            trace('[trezor-provider] Ignoring message with invalid target or nonce', msg);

            return;
        }

        trace('[trezor-provider] Received message', msg);

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
            trace('request ' + args.method);
            const id = nextId++;
            pending[id] = { resolve, reject };
            window.postMessage(
                { target: REQUEST, nonce, id, method: args.method, params: args.params },
                '*', // FIXME:
            );
        });

    const provider: any = {
        isTrezor: true,
        isMetaMask: false,
        // Legacy MetaMask-style properties some dApps read synchronously to
        // detect an existing connection; populated on init below.
        chainId: null,
        networkVersion: null,
        selectedAddress: null,
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

    // EIP-6963 multi-provider discovery, announced with a STABLE per-load uuid
    // and stable rdns. SSR wallet libraries (e.g. wagmi, as used by revoke.cash)
    // attach their EIP-6963 listener only after the page hydrates — long after
    // our document-start injection — so late discovery is handled by (a)
    // re-dispatching the SAME detail whenever a subscriber asks via
    // `eip6963:requestProvider`, and (b) the bounded re-announce loop below.
    // Re-dispatching the unchanged detail is the canonical mechanism; uuid
    // novelty buys nothing and only bloats uuid-keyed stores.
    const announce = () => {
        const detail = {
            info: { uuid: sessionUuid, name: info.name, rdns: info.rdns, icon: info.icon },
            provider,
        };
        window.dispatchEvent(
            new CustomEvent('eip6963:announceProvider', { detail: Object.freeze(detail) }),
        );
    };
    window.addEventListener('eip6963:requestProvider', () => {
        trace('received eip6963:requestProvider');
        announce();
    });
    announce();
    trace('provider injected; window.ethereum set; announced');

    // Establish the connection state so the dApp auto-connects to the granted
    // account without a manual "Connect". The host has the grant set before the
    // page loads, so eth_accounts/eth_chainId resolve immediately and with no
    // prompt. Cache them so the values can be re-emitted on the announce cadence
    // (below) — within a page load the grant never changes (an account switch
    // reloads the view), so a single fetch is enough.
    let connectedChainId: any = null;
    let connectedAccounts: any = null;

    const emitConnection = () => {
        if (connectedChainId !== null) {
            emit('connect', { chainId: connectedChainId });
        }
        if (connectedAccounts && connectedAccounts.length > 0) {
            emit('accountsChanged', connectedAccounts);
        }
    };

    request({ method: 'eth_chainId' })
        .then((chainId: any) => {
            connectedChainId = chainId;
            provider.chainId = chainId;
            provider.networkVersion = String(Number(chainId));
            emit('connect', { chainId });
            trace('eth_chainId = ' + chainId);
        })
        .catch(e => {
            trace('eth_chainId error: ' + e.message);
        });

    request({ method: 'eth_accounts' })
        .then((accounts: any) => {
            if (Array.isArray(accounts) && accounts.length > 0) {
                connectedAccounts = accounts;
                provider.selectedAddress = accounts[0];
                emit('accountsChanged', accounts);
            }
            trace('eth_accounts = ', accounts);
        })
        .catch(e => {
            trace('eth_accounts error: ', e);
        });

    // Re-announce (EIP-6963) AND re-emit the cached connection on a short bounded
    // cadence. wagmi attaches its provider-event listeners only once it has set
    // up a connector for us (after the dApp discovers us, post-hydration), which
    // can be seconds after our document-start injection — so a single init-time
    // emit would be missed. Re-emitting alongside each announce means that
    // whichever order discovery / hydration / reconnect happen in, a live
    // connector still receives the connect / accountsChanged it can act on.
    let announceTicks = 0;
    const announceTimer = setInterval(() => {
        announceTicks += 1;
        announce();
        emitConnection();
        if (announceTicks >= 40) {
            clearInterval(announceTimer);
        }
    }, 250);
}

/**
 * The Trezor mark as a base64 SVG data URI (EIP-6963 requires the icon to be a
 * data URI). The official symbol is white, so it is set on a Trezor-green
 * (#136334, brand "Forest") rounded card — a self-contained icon that stays
 * legible on any dApp wallet-picker background (a bare white symbol vanishes on
 * a light picker). Source path: product-components trezor_logo_symbol.
 */
export const DAPP_BROWSER_PROVIDER_ICON =
    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNTYiIGhlaWdodD0iMjU2IiB2aWV3Qm94PSIwIDAgMjU2IDI1NiI+PHJlY3Qgd2lkdGg9IjI1NiIgaGVpZ2h0PSIyNTYiIHJ4PSI1NiIgZmlsbD0iIzEzNjMzNCIvPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDcyLjg3IDQ4KSBzY2FsZSgwLjQyMjgzKSI+PHBhdGggZmlsbD0iI2ZmZmZmZiIgZD0ibTIyMi43LDg3LjgyQzIyMi43LDM5LjgyLDE4MS4wNSwwLDEzMC4zNSwwUzM4LDM5Ljg0LDM4LDg3LjgydjI4LjA3SDB2MjAxLjloMGwxMzAuMzUsNjAuNjIsMTMwLjM4LTYwLjY2aDBWMTE2Ljc1aC0zOGwtLjAzLTI4LjkzWm0tMTM3LjYyLDBjMC0yMi42MywxOS45Mi00MC43NCw0NS4yNy00MC43NHM0NS4yNywxOC4xMSw0NS4yNyw0MC43NHYyOC4wN2gtOTAuNTR2LTI4LjA3Wm0xMjMuMTMsMTk3LjM3bC03Ny44NiwzNi4yMi03Ny44Ni0zNi4yMnYtMTIxLjMyaDE1NS43MnYxMjEuMzJaIi8+PC9nPjwvc3ZnPg==';

/**
 * Build the self-contained provider source to inject into the dApp main world.
 */
export const createInjectedProviderSource = (config: InjectedProviderConfig): string =>
    `(${injectedProvider.toString()})(${JSON.stringify(config)});`;
