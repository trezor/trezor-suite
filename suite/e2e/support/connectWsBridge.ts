import { Page } from '@playwright/test';
import { WebSocketServer } from 'ws';

/**
 * Node stand-in for the Tauri Rust connect-ws server (see packages/suite-desktop-tauri/src-tauri —
 * connect_ws.rs). The Electron build hosts ws://127.0.0.1:21335/connect-ws in its main process; the
 * native Tauri build hosts it in Rust. For the Chromium-driven Tauri e2e target there is no native
 * backend, so this bridge provides the same ws endpoint and relays messages between the dApp
 * (connect-web with coreMode:'suite-desktop', running in the test page) and the Suite's
 * connect-popup handler (window.desktopApi, in the same page):
 *
 *   dApp ──ws──▶ this bridge ──page.evaluate──▶ desktopApi 'connect-popup/call' listener
 *   dApp ◀──ws── this bridge ◀──exposeFunction── desktopApi.connectPopupResponse
 *
 * Protocol mirrors packages/suite-desktop-core/src/libs/connect-ws.ts.
 */
const PORT = 21335;

// message-type constants (packages/connect-common/src/events)
const PING = 'ping';
const CORE_CALL = 'iframe-call';
const CORE_CALL_CANCEL = 'core-call-cancel';
const POPUP_HANDSHAKE = 'popup-handshake';
const POPUP_CLOSED = 'popup-closed';

export type ConnectWsBridge = { close: () => Promise<void> };

export const startConnectWsBridge = async (page: Page): Promise<ConnectWsBridge> => {
    const pending: Record<string, (resp: any) => void> = {};

    await page.exposeFunction('__tauriConnectPopupResponseToNode', (resp: any) => {
        const cb = resp && pending[resp.id];
        if (cb) {
            delete pending[resp.id];
            cb(resp);
        }
    });

    const wss = new WebSocketServer({ port: PORT, path: '/connect-ws' });

    const emitToPage = (channel: string, payload: any) =>
        page
            .evaluate(([ch, p]) => (window as any).__tauriEmitDesktopEvent?.(ch, p), [
                channel,
                payload,
            ] as const)
            .catch(() => {
                /* page may be navigating/closing */
            });

    wss.on('connection', (ws, req) => {
        const origin = req.headers.origin ?? '';
        let manifest: any;
        let version: any;
        const pendingIds = new Set<string>();

        ws.on('message', async data => {
            let msg: any;
            try {
                msg = JSON.parse(data.toString());
            } catch {
                return;
            }
            if (!msg || typeof msg.type !== 'string') return;

            if (msg.type === PING) {
                ws.send(JSON.stringify({ id: msg.id, type: 'pong' }));

                return;
            }
            if (msg.type === POPUP_HANDSHAKE) {
                manifest = msg.payload?.settings?.manifest;
                version = msg.payload?.settings?.version;
                ws.send(JSON.stringify({ id: msg.id, type: POPUP_HANDSHAKE, payload: 'ok' }));

                return;
            }
            if (msg.type === POPUP_CLOSED || msg.type === CORE_CALL_CANCEL) {
                await emitToPage('connect-popup/cancel', {
                    error: msg.payload?.reason ?? msg.payload?.error,
                    callId: msg.payload?.callId,
                });

                return;
            }
            if (msg.type === CORE_CALL && msg.payload?.method) {
                const { method, ...rest } = msg.payload;
                pending[msg.id] = resp => {
                    pendingIds.delete(msg.id);
                    ws.send(JSON.stringify({ ...resp, id: msg.id }));
                };
                pendingIds.add(msg.id);

                await emitToPage('connect-popup/call', {
                    id: msg.id,
                    method,
                    payload: rest,
                    origin,
                    // The dApp (connect-web) runs in the Playwright Node process, so the process that
                    // opened the socket is node — matching what Electron's findProcessFromIncomingPort
                    // reports (the permissions test asserts /^(node|MainThread)$/).
                    process: { name: 'node', fullPath: process.execPath, warning: false },
                    manifest: manifest
                        ? {
                              appName: manifest.appName,
                              appIcon: manifest.appIcon,
                              appUrl: manifest.appUrl,
                              email: manifest.email,
                              npmVersion: version,
                          }
                        : { appName: 'Tester' },
                });
            }
        });

        ws.on('close', () => {
            for (const id of pendingIds) delete pending[id];
            pendingIds.clear();
        });
        ws.on('error', () => {
            /* ignore */
        });
    });

    await new Promise<void>((resolve, reject) => {
        wss.once('listening', resolve);
        wss.once('error', reject);
    });

    return {
        close: () =>
            new Promise<void>(resolve => {
                for (const ws of wss.clients) ws.terminate();
                wss.close(() => resolve());
            }),
    };
};
