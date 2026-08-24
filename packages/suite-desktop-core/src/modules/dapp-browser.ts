/**
 * dApp-browser host module (M1 + M2).
 *
 * Owns a single sandboxed `WebContentsView` that renders a catalog dApp origin
 * "below" the Suite-rendered top bar. A `WebContentsView` is a native layer
 * painted on top of the window's web contents and ignores DOM z-index (§2), so
 * the renderer reports the placeholder rect over IPC and this module positions
 * the view with `setBounds`. The view starts hidden and is revealed only once
 * the first bounds arrive, to avoid a full-window flash.
 *
 * The view loads a dApp-only preload that injects an EIP-1193 / EIP-6963
 * provider and bridges its requests here over `DAPP_PROVIDER_IPC.REQUEST`. This
 * module classifies each request (§7) and answers the `state` lane from the
 * ephemeral grant the renderer pushes via `set-grant` (the selected address and
 * chainId). The `node` and `device` lanes land in M3 and M4/M5. Provider events
 * (accountsChanged / chainChanged) are pushed back to the page over
 * `DAPP_PROVIDER_IPC.EVENT`.
 *
 * Navigation is hard-locked to the catalog origin. The dApp is kept captive: it
 * can never spawn a child window/popup or hand a URL to the OS browser. A
 * `target="_blank"` / `window.open` to the dApp's own origin is rewired into the
 * existing view so in-app links still work; anything cross-origin is dropped.
 */
import { randomUUID } from 'crypto';
import { WebContentsView, clipboard, ipcMain as electronIpcMain, session } from 'electron';
import path from 'path';

import {
    DAPP_PROVIDER_IPC,
    type DappCatalogEntry,
    type ProviderResult,
    RPC_ERROR,
    classifyMethod,
    eip1193RequestSchema,
    getCatalogEntryById,
    switchChainParamsSchema,
} from '@suite/dapp-browser';

import { dappBrowserRpcEndpoints } from '../config';
import { ipcMain } from '../typed-electron';
import type { ModuleInit } from './module';

export const SERVICE_NAME = 'dapp-browser';

// Dedicated log group for the dApp page's own console output, kept separate from
// the module's operational logs and tagged per dApp so it is easy to filter.
const DAPP_CONSOLE_LOG_GROUP = `${SERVICE_NAME}/console`;

// Ephemeral session — no `persist:` prefix, so nothing the dApp stores survives
// a restart (§8). Isolated from the Suite renderer's default session.
const DAPP_SESSION_PARTITION = 'dapp-browser';

// A device-lane request can sit on the on-device confirmation for a while.
const DEVICE_REQUEST_TIMEOUT_MS = 5 * 60 * 1000;

/** Visibility grant pushed from the renderer — never a signing approval (§8). */
type DappGrant = {
    address: string;
    chainId: number;
};

type ActiveDapp = {
    view: WebContentsView;
    entry: DappCatalogEntry;
    grant?: DappGrant;
    // The native view ignores DOM z-index and paints over the Suite renderer, so
    // it is hidden while a Suite overlay (account menu, modal, …) is on top. The
    // renderer drives this via `set-visible`; we remember it so a re-layout
    // (`set-bounds`, which fires on every resize/scroll) doesn't reveal it again.
    overlayHidden: boolean;
};

let activeDapp: ActiveDapp | undefined;

const toHexChainId = (chainId: number) => `0x${chainId.toString(16)}`;

const denied = (code: number, message: string): ProviderResult => ({
    ok: false,
    error: { code, message },
});

const handleStateMethod = (method: string, grant: DappGrant | undefined): ProviderResult => {
    switch (method) {
        case 'eth_requestAccounts':
        case 'eth_accounts':
            return { ok: true, result: grant ? [grant.address] : [] };
        case 'eth_chainId':
            return { ok: true, result: grant ? toHexChainId(grant.chainId) : '0x1' };
        case 'net_version':
            return { ok: true, result: grant ? String(grant.chainId) : '1' };
        case 'wallet_requestPermissions':
            return { ok: true, result: [{ parentCapability: 'eth_accounts' }] };
        case 'wallet_getPermissions':
            return { ok: true, result: grant ? [{ parentCapability: 'eth_accounts' }] : [] };
        default:
            return denied(RPC_ERROR.UNSUPPORTED_METHOD, `${method} is not supported`);
    }
};

// wallet_switchEthereumChain (§6, EIP-3326): switch only to a chain Suite has a
// bundled RPC endpoint for, else 4902. PoC ships Ethereum mainnet only, so any
// other chain self-limits the dApp — a clean demo of the deny path.
const handleSwitchChain = (params: unknown): ProviderResult => {
    const parsed = switchChainParamsSchema.safeParse(params);

    if (!parsed.success) {
        return denied(RPC_ERROR.INVALID_PARAMS, 'Invalid params');
    }

    const targetChainId = parseInt(parsed.data[0].chainId, 16);

    if (!dappBrowserRpcEndpoints[targetChainId]) {
        return denied(RPC_ERROR.UNRECOGNIZED_CHAIN, `Chain ${targetChainId} is not available`);
    }

    // Only switch when there is a connected account — never fabricate a grant
    // with an empty address (which would slip past the device-lane guard).
    if (!activeDapp?.grant) {
        return denied(RPC_ERROR.UNAUTHORIZED, 'No connected account');
    }

    activeDapp.grant = { address: activeDapp.grant.address, chainId: targetChainId };
    activeDapp.view.webContents.send(DAPP_PROVIDER_IPC.EVENT, {
        event: 'chainChanged',
        data: toHexChainId(targetChainId),
    });

    return { ok: true, result: null };
};

// node lane (§10): forward the read raw to a Suite-bundled per-chain JSON-RPC
// endpoint. The dApp can never influence which endpoint is used.
const handleNodeMethod = async (
    method: string,
    params: unknown,
    chainId: number,
): Promise<ProviderResult> => {
    const url = dappBrowserRpcEndpoints[chainId];

    if (!url) {
        return denied(
            RPC_ERROR.UNRECOGNIZED_CHAIN,
            `No RPC endpoint configured for chain ${chainId}`,
        );
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params: params ?? [] }),
        });
        const json = (await response.json()) as {
            result?: unknown;
            error?: { code?: number; message?: string };
        };

        if (json.error) {
            return {
                ok: false,
                error: {
                    code: json.error.code ?? RPC_ERROR.INTERNAL_ERROR,
                    message: json.error.message ?? 'RPC error',
                },
            };
        }

        return { ok: true, result: json.result };
    } catch (error) {
        global.logger.warn(SERVICE_NAME, `node RPC ${method} failed: ${error}`);

        return denied(RPC_ERROR.INTERNAL_ERROR, 'RPC request failed');
    }
};

type DispatchDevice = (method: string, params: unknown) => Promise<ProviderResult>;

const handleProviderRequest = (
    payload: unknown,
    dispatchDevice: DispatchDevice,
): ProviderResult | Promise<ProviderResult> => {
    // Validate the untrusted request envelope at the boundary (§7, §12).
    const parsed = eip1193RequestSchema.safeParse(payload);

    if (!parsed.success) {
        return denied(RPC_ERROR.INVALID_PARAMS, 'Invalid request');
    }

    const { method, params } = parsed.data;
    const lane = classifyMethod('eip155', method);

    switch (lane) {
        case 'state':
            return method === 'wallet_switchEthereumChain'
                ? handleSwitchChain(params)
                : handleStateMethod(method, activeDapp?.grant);
        case 'node':
            return handleNodeMethod(method, params, activeDapp?.grant?.chainId ?? 1);
        case 'device':
            // Relayed to the Suite renderer for on-device signing (Invariant 0).
            return dispatchDevice(method, params);
        case 'deny':
            return denied(RPC_ERROR.UNSUPPORTED_METHOD, `${method} is not supported`);
        default:
            return denied(RPC_ERROR.UNSUPPORTED_METHOD, `${method} is not supported`);
    }
};

/**
 * Consulted by the global `will-navigate` guard in `app.ts` so the dApp view may
 * navigate within its own allow-listed origin while every other web-contents
 * stays locked to https://trezor.io.
 */
export const isAllowedDappNavigation = (contents: Electron.WebContents, origin: string): boolean =>
    activeDapp?.view.webContents === contents && activeDapp.entry.origin === origin;

export const init: ModuleInit = ({ mainWindowProxy }) => {
    const { logger } = global;

    // device-lane requests awaiting a response from the Suite renderer.
    const pendingDeviceRequests = new Map<string, (result: ProviderResult) => void>();

    const dispatchDeviceRequest: DispatchDevice = (method, params) =>
        new Promise(resolve => {
            const mainWindow = mainWindowProxy.getInstance();

            if (!mainWindow || !activeDapp?.grant) {
                resolve(denied(RPC_ERROR.UNAUTHORIZED, 'No connected account'));

                return;
            }

            const requestId = randomUUID();
            const timeout = setTimeout(() => {
                if (pendingDeviceRequests.delete(requestId)) {
                    resolve(denied(RPC_ERROR.USER_REJECTED, 'Request timed out'));
                }
            }, DEVICE_REQUEST_TIMEOUT_MS);

            pendingDeviceRequests.set(requestId, result => {
                clearTimeout(timeout);
                resolve(result);
            });

            mainWindow.webContents.send('dapp-browser/dispatch-request', {
                requestId,
                method,
                params,
                address: activeDapp.grant.address,
                chainId: activeDapp.grant.chainId,
                origin: activeDapp.entry.origin,
                appName: activeDapp.entry.name,
            });
        });

    const closeDapp = () => {
        if (!activeDapp) {
            return;
        }

        const { view } = activeDapp;
        activeDapp = undefined;

        // Fail any in-flight signing requests rather than leaving them hanging.
        pendingDeviceRequests.forEach(resolve =>
            resolve(denied(RPC_ERROR.DISCONNECTED, 'dApp closed')),
        );
        pendingDeviceRequests.clear();

        try {
            mainWindowProxy.getInstance()?.contentView.removeChildView(view);
        } catch (error) {
            logger.warn(SERVICE_NAME, `Failed to detach dApp view: ${error}`);
        }

        if (!view.webContents.isDestroyed()) {
            view.webContents.close();
        }
    };

    ipcMain.handle('dapp-browser/open', (_, { entryId, grant }) => {
        const mainWindow = mainWindowProxy.getInstance();

        if (!mainWindow) {
            return { success: false, error: 'Main window unavailable' };
        }

        const entry = getCatalogEntryById(entryId);

        if (!entry) {
            return { success: false, error: `Unknown dApp: ${entryId}` };
        }

        // Only one dApp open at a time.
        closeDapp();

        const view = new WebContentsView({
            webPreferences: {
                session: session.fromPartition(DAPP_SESSION_PARTITION),
                contextIsolation: true,
                sandbox: true,
                nodeIntegration: false,
                webSecurity: true,
                preload: path.join(__dirname, 'dapp-provider-preload.js'),
                devTools: true,
            },
        });

        // Lock navigation to the catalog origin (the global guard in app.ts
        // also defers to `isAllowedDappNavigation`).
        view.webContents.on('will-navigate', (event, url) => {
            if (new URL(url).origin !== entry.origin) {
                logger.warn(SERVICE_NAME, `Blocked dApp navigation to ${url}`);
                event.preventDefault();
            }
        });

        // Keep the dApp captive: never spawn a child window/popup and never hand
        // a URL to the OS browser. A `target="_blank"` / `window.open` to the
        // dApp's own origin is rewired into the existing view so in-app links
        // still work; anything cross-origin is dropped (the view is hard-locked
        // to the catalog origin — see the `will-navigate` guard above).
        view.webContents.setWindowOpenHandler(({ url }) => {
            let isSameOrigin = false;

            try {
                isSameOrigin = new URL(url).origin === entry.origin;
            } catch {
                isSameOrigin = false;
            }

            if (isSameOrigin) {
                view.webContents.loadURL(url).catch(error => {
                    logger.error(SERVICE_NAME, `Failed to open ${url} in frame: ${error}`);
                });
            } else {
                logger.warn(SERVICE_NAME, `Blocked dApp popup/new window to ${url}`);
            }

            return { action: 'deny' };
        });

        // Surface the dApp page's console output in Suite's logs (debugging aid).
        // Read synchronously from the event object — no await — so it never
        // touches a navigated/destroyed frame.
        view.webContents.on('console-message', details => {
            const line = `[${entry.name}] ${details.message}  ·  ${details.sourceId}:${details.lineNumber}`;

            switch (details.level) {
                case 'error':
                    logger.error(DAPP_CONSOLE_LOG_GROUP, line);
                    break;
                case 'warning':
                    logger.warn(DAPP_CONSOLE_LOG_GROUP, line);
                    break;
                case 'info':
                    logger.info(DAPP_CONSOLE_LOG_GROUP, line);
                    break;
                case 'debug':
                    logger.debug(DAPP_CONSOLE_LOG_GROUP, line);
                    break;
            }
        });

        mainWindow.contentView.addChildView(view);
        // Stay hidden until the renderer reports where to place the view.
        view.setVisible(false);

        // Set the grant BEFORE loading so the page's provider auto-connects on
        // its very first eth_accounts/eth_chainId — no separate set-grant race.
        activeDapp = { view, entry, grant, overlayHidden: false };

        view.webContents.loadURL(entry.url).catch(error => {
            logger.error(SERVICE_NAME, `Failed to load ${entry.url}: ${error}`);
        });
        logger.info(SERVICE_NAME, `Opened dApp ${entry.id} (${entry.url})`);

        return { success: true };
    });

    ipcMain.handle('dapp-browser/close', () => {
        closeDapp();
    });

    ipcMain.handle('dapp-browser/set-bounds', (_, bounds) => {
        if (!activeDapp) {
            return;
        }

        activeDapp.view.setBounds({
            x: Math.round(bounds.x),
            y: Math.round(bounds.y),
            width: Math.round(bounds.width),
            height: Math.round(bounds.height),
        });
        // First bounds reveal the view (it starts hidden to avoid a flash); a
        // later re-layout must honour an active overlay hide rather than undo it.
        activeDapp.view.setVisible(!activeDapp.overlayHidden);
    });

    ipcMain.handle('dapp-browser/set-visible', (_, { visible }) => {
        if (!activeDapp) {
            return;
        }

        activeDapp.overlayHidden = !visible;
        activeDapp.view.setVisible(visible);
    });

    // Renderer pushes the current visibility grant (selected address + chainId).
    ipcMain.handle('dapp-browser/set-grant', (_, grant) => {
        if (activeDapp) {
            activeDapp.grant = grant;
        }
    });

    ipcMain.handle('dapp-browser/reload', () => {
        activeDapp?.view.webContents.reload();
    });

    ipcMain.handle('dapp-browser/go-back', () => {
        activeDapp?.view.webContents.navigationHistory.goBack();
    });

    ipcMain.handle('dapp-browser/go-forward', () => {
        activeDapp?.view.webContents.navigationHistory.goForward();
    });

    // Toggle DevTools for the dApp page (driven by the top-bar button — the dApp
    // view is a `WebContentsView`, not a `BrowserWindow`, so it has no menu or
    // keyboard-shortcut path of its own). Detached, so the DevTools window does
    // not fight the native view's bounds or the Suite chrome.
    ipcMain.handle('dapp-browser/toggle-devtools', () => {
        const contents = activeDapp?.view.webContents;

        if (!contents) {
            return;
        }

        if (contents.isDevToolsOpened()) {
            contents.closeDevTools();
        } else {
            contents.openDevTools({ mode: 'detach' });
        }
    });

    // WalletConnect shortcut (§5): the user copies a wc: URI, then this reads it.
    // User-initiated only — never on a timer.
    ipcMain.handle('dapp-browser/read-clipboard', () => clipboard.readText());

    // Suite renderer returns the result of a relayed device-lane request.
    ipcMain.handle('dapp-browser/dispatch-response', (_, { requestId, result, error }) => {
        const resolve = pendingDeviceRequests.get(requestId);

        if (resolve) {
            pendingDeviceRequests.delete(requestId);
            resolve(error ? { ok: false, error } : { ok: true, result });
        }
    });

    // dApp-only provider bridge (raw channel from the dApp preload). Uses
    // send/reply rather than invoke/handle: a request can still be in flight when
    // the dApp frame navigates or reloads (e.g. an account switch, or a slow
    // device-lane signing), and invoke's auto-reply would then index that
    // navigated/destroyed frame ("Frame property was accessed after it
    // navigated…"). Replying through the WebContents (`event.sender`) targets the
    // current frame and is skipped entirely once the view is gone.
    electronIpcMain.on(
        DAPP_PROVIDER_IPC.REQUEST,
        (event, payload: { requestId: number; method: string; params?: unknown }) => {
            const { requestId, method, params } = payload;

            const reply = (outcome: ProviderResult) => {
                if (!event.sender.isDestroyed()) {
                    event.sender.send(DAPP_PROVIDER_IPC.RESPONSE, { requestId, outcome });
                }
            };

            Promise.resolve(handleProviderRequest({ method, params }, dispatchDeviceRequest))
                .then(reply)
                .catch(() => reply(denied(RPC_ERROR.INTERNAL_ERROR, 'Internal error')));
        },
    );

    // A hard reload — or any full top-level navigation — of the Suite renderer
    // rebuilds the React tree that manages this view, but the native
    // `WebContentsView` lives in the main process and survives the reload.
    // Orphaned, with no renderer left to position, hide, or close it, it would
    // keep painting over the whole window. Tear it down whenever the host's main
    // frame starts a real (non-same-document) navigation. Read only the plain
    // fields off `details` — never `details.frame`, which may already be a
    // navigated/destroyed frame.
    mainWindowProxy.on('init', mainWindow => {
        mainWindow.webContents.on('did-start-navigation', details => {
            if (details.isMainFrame && !details.isSameDocument) {
                closeDapp();
            }
        });
    });

    // Tear down if the main window goes away.
    mainWindowProxy.on('destroy', closeDapp);
};
