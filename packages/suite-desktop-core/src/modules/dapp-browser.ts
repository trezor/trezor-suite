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
 * Navigation is hard-locked to the catalog origin; in-view popups are denied and
 * external links open in the OS browser.
 */
import { WebContentsView, ipcMain as electronIpcMain, session, shell } from 'electron';
import path from 'path';

import {
    DAPP_PROVIDER_IPC,
    type DappCatalogEntry,
    type ProviderResult,
    RPC_ERROR,
    classifyMethod,
    eip1193RequestSchema,
    getCatalogEntryById,
} from '@suite/dapp-browser';

import { dappBrowserRpcEndpoints } from '../config';
import { ipcMain } from '../typed-electron';
import type { ModuleInit } from './module';

export const SERVICE_NAME = 'dapp-browser';

// Ephemeral session — no `persist:` prefix, so nothing the dApp stores survives
// a restart (§8). Isolated from the Suite renderer's default session.
const DAPP_SESSION_PARTITION = 'dapp-browser';

/** Visibility grant pushed from the renderer — never a signing approval (§8). */
type DappGrant = {
    address: string;
    chainId: number;
};

type ActiveDapp = {
    view: WebContentsView;
    entry: DappCatalogEntry;
    grant?: DappGrant;
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
        case 'wallet_switchEthereumChain':
            // M6 implements switching; until then only the connected chain exists.
            return denied(RPC_ERROR.UNRECOGNIZED_CHAIN, 'Chain switching is not yet supported');
        default:
            return denied(RPC_ERROR.UNSUPPORTED_METHOD, `${method} is not supported`);
    }
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

const handleProviderRequest = (payload: unknown): ProviderResult | Promise<ProviderResult> => {
    // Validate the untrusted request envelope at the boundary (§7, §12).
    const parsed = eip1193RequestSchema.safeParse(payload);

    if (!parsed.success) {
        return denied(RPC_ERROR.INVALID_PARAMS, 'Invalid request');
    }

    const { method, params } = parsed.data;
    const lane = classifyMethod('eip155', method);

    switch (lane) {
        case 'state':
            return handleStateMethod(method, activeDapp?.grant);
        case 'node':
            return handleNodeMethod(method, params, activeDapp?.grant?.chainId ?? 1);
        case 'device':
            // On-device signing lands in M4 (eth_sendTransaction) and M5 (sign/typed).
            return denied(RPC_ERROR.INTERNAL_ERROR, `${method} is not yet supported`);
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

    const closeDapp = () => {
        if (!activeDapp) {
            return;
        }

        const { view } = activeDapp;
        activeDapp = undefined;

        try {
            mainWindowProxy.getInstance()?.contentView.removeChildView(view);
        } catch (error) {
            logger.warn(SERVICE_NAME, `Failed to detach dApp view: ${error}`);
        }

        if (!view.webContents.isDestroyed()) {
            view.webContents.close();
        }
    };

    ipcMain.handle('dapp-browser/open', (_, { entryId }) => {
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

        // Deny in-view popups; route external links to the OS browser.
        view.webContents.setWindowOpenHandler(({ url }) => {
            shell.openExternal(url);

            return { action: 'deny' };
        });

        mainWindow.contentView.addChildView(view);
        // Stay hidden until the renderer reports where to place the view.
        view.setVisible(false);

        activeDapp = { view, entry };

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
        activeDapp.view.setVisible(true);
    });

    ipcMain.handle('dapp-browser/set-visible', (_, { visible }) => {
        activeDapp?.view.setVisible(visible);
    });

    // Renderer pushes the current visibility grant (selected address + chainId).
    ipcMain.handle('dapp-browser/set-grant', (_, grant) => {
        if (activeDapp) {
            activeDapp.grant = grant;
        }
    });

    // Renderer pushes a provider event (accountsChanged / chainChanged) to the dApp.
    ipcMain.handle('dapp-browser/emit-event', (_, payload) => {
        activeDapp?.view.webContents.send(DAPP_PROVIDER_IPC.EVENT, payload);
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

    // dApp-only provider bridge (raw channel from the dApp preload).
    electronIpcMain.handle(DAPP_PROVIDER_IPC.REQUEST, (_event, payload) =>
        handleProviderRequest(payload),
    );

    // Tear down if the main window goes away.
    mainWindowProxy.on('destroy', closeDapp);
};
