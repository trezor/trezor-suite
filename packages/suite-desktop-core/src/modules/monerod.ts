/**
 * Local Monero daemon (monerod) feature: download the binary, run it as a managed
 * child process and report download + blockchain-sync progress to the renderer.
 *
 * Models the monero-gui approach (local node, client-side scanning) — see the
 * Monero roadmap in the plan. This module covers the daemon lifecycle only; the
 * wallet (balance/tx/spend) is built on top of it as a follow-up.
 */
import { captureException } from '@sentry/electron/main';
import { mkdirSync } from 'fs';
import path from 'path';

import { validateIpcMessage } from '@trezor/ipc-proxy';
import type { MonerodStatus } from '@trezor/suite-desktop-api';

import { downloadMonerod, isMonerodDownloaded } from '../libs/monerod/downloadMonerod';
import { hasSwitch } from '../libs/process-switches';
import { MonerodProcess } from '../libs/processes/MonerodProcess';
import { app, ipcMain } from '../typed-electron';
import type { Dependencies } from './module';

export const SERVICE_NAME = 'monerod';

const SYNC_POLL_INTERVAL = 3_000;

const load = ({ mainWindowProxy, store }: Dependencies) => {
    const { logger } = global;
    // e2e/dev: skip the real (large) binary download and emit synthetic progress.
    const isMock = hasSwitch('mock-monerod');

    // Standard Monero ports. They must match the RPC URL that @trezor/connect uses for the
    // backend (coins.json `blockchain_link` for XMR → http://127.0.0.1:18081), so they are fixed
    // rather than dynamically allocated.
    const rpcPort = 18081;
    const p2pPort = 18080;
    const zmqPort = 18082;
    const dataDir = path.join(app.getPath('userData'), 'monero');
    const binDir = path.join(app.getPath('userData'), 'bin', 'monerod');

    // Persisted monero-ts wallet files (the client-side view-key scan cache) live here so the scan
    // can resume across restarts instead of re-scanning from the wallet birthday. The connect
    // blockchain-link worker runs in this same main process and picks the dir up via this env var;
    // the files are local-only (userData), covered by Suite's data-at-rest model.
    const walletDir = path.join(dataDir, 'wallets');
    mkdirSync(walletDir, { recursive: true });
    process.env.TREZOR_MONERO_WALLET_DIR = walletDir;

    store.setMonerodSettings({
        ...store.getMonerodSettings(),
        rpcPort,
        p2pPort,
        zmqPort,
        dataDir,
    });
    const settings = store.getMonerodSettings();

    const monerodProcess = new MonerodProcess({
        network: settings.network,
        host: settings.host,
        rpcPort,
        p2pPort,
        zmqPort,
        dataDir,
        binDir,
    });

    const win = () => mainWindowProxy.getInstance();
    const sendStatus = (type: MonerodStatus, message?: string) =>
        win()?.webContents.send('monerod/status', { type, message });
    const sendDownloadProgress = (current: number, total: number) =>
        win()?.webContents.send('monerod/download-progress', { progress: { current, total } });
    const sendSyncProgress = (current: number, total: number) =>
        win()?.webContents.send('monerod/sync-progress', {
            height: current,
            targetHeight: total,
            progress: { current, total },
        });

    let syncPoll: ReturnType<typeof setInterval> | null = null;
    const stopSyncPoll = () => {
        if (syncPoll) {
            clearInterval(syncPoll);
            syncPoll = null;
        }
    };

    // Synthetic 0 -> 100% download used in mock mode (mirrors Tor's fake bootstrap).
    const fakeDownload = () =>
        new Promise<void>(resolve => {
            let progress = 0;
            const id = setInterval(() => {
                progress = Math.min(100, progress + 20);
                sendDownloadProgress(progress, 100);
                if (progress >= 100) {
                    clearInterval(id);
                    resolve();
                }
            }, 150);
        });

    const beginSyncPolling = () => {
        stopSyncPoll();
        syncPoll = setInterval(async () => {
            const status = await monerodProcess.status();

            // `synchronized` (target_height -> 0) is the only authoritative "done" signal.
            if (status.synchronized) {
                stopSyncPoll();
                sendStatus('Enabled');

                return;
            }

            // The daemon went away (crash / still booting after a restart). Don't leave the UI
            // frozen on a stale "Syncing X%"; report it as starting again.
            if (!status.service) {
                sendStatus('Starting');

                return;
            }

            if (status.syncProgress) {
                const { current, total } = status.syncProgress;
                // monerod's `target_height` is the highest height advertised by current peers and
                // can be reached before the node is actually at the network tip (`synchronized`
                // still false). Never report 100% until then, otherwise the bar looks "done" while
                // the node keeps catching up.
                const cappedTotal = current >= total ? current + 1 : total;
                sendSyncProgress(current, cappedTotal);
            }
        }, SYNC_POLL_INTERVAL);
    };

    const setupMonerod = async (shouldEnable: boolean) => {
        if (!shouldEnable) {
            stopSyncPoll();
            await monerodProcess.stop();
            sendStatus('Disabled');

            return;
        }

        sendStatus('Downloading');
        try {
            if (isMock) {
                await fakeDownload();
            } else if (!isMonerodDownloaded(binDir)) {
                await downloadMonerod({ binDir, onProgress: sendDownloadProgress });
            }
        } catch (error) {
            logger.error('monerod', `Download failed: ${error.message}`);
            sendStatus('Error', error.message);
            throw error;
        }

        if (isMock) {
            // No real daemon in mock mode — report ready once the (mocked) download finishes.
            sendStatus('Enabled');

            return;
        }

        try {
            sendStatus('Starting');
            await monerodProcess.start();
            sendStatus('Syncing');
            beginSyncPolling();
        } catch (error) {
            logger.error('monerod', `Failed to start: ${error.message}`);
            sendStatus('Error', error.message);
            await monerodProcess.stop();
            throw error;
        }
    };

    ipcMain.handle('monerod/toggle', async (ipcEvent, shouldEnable: boolean) => {
        validateIpcMessage({ ipcEvent });

        logger.info('monerod', `Toggling ${shouldEnable ? 'ON' : 'OFF'}`);

        try {
            store.setMonerodSettings({ ...store.getMonerodSettings(), running: shouldEnable });
            await setupMonerod(shouldEnable);

            return { success: true };
        } catch (error) {
            captureException(error);

            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('monerod/get-settings', ipcEvent => {
        validateIpcMessage({ ipcEvent });
        const { running, network } = store.getMonerodSettings();

        return { success: true, payload: { running, network } };
    });

    ipcMain.on('monerod/get-status', async () => {
        const { running } = store.getMonerodSettings();
        if (!running) {
            sendStatus('Disabled');

            return;
        }
        const status = await monerodProcess.status();
        if (!status.service) {
            sendStatus('Starting');
        } else {
            sendStatus(status.synchronized ? 'Enabled' : 'Syncing');
        }
    });

    // Resume the daemon on launch if it was enabled previously (mirrors Tor). Without this, a
    // persisted `running: true` (including one left behind by a failed earlier attempt) would show
    // the toggle as on while nothing actually downloads or starts.
    if (store.getMonerodSettings().running) {
        logger.info(SERVICE_NAME, 'Resuming on launch (was enabled)');
        setupMonerod(true).catch(error =>
            logger.error(SERVICE_NAME, `Auto-start failed: ${error.message}`),
        );
    }

    return { process: monerodProcess, dispose: stopSyncPoll };
};

type MonerodModule = (dependencies: Dependencies) => {
    onLoad: () => void;
    onQuit: () => Promise<void>;
};

export const init: MonerodModule = dependencies => {
    let loaded = false;
    let monerodProcess: MonerodProcess | undefined;
    let dispose: (() => void) | undefined;

    const onLoad = () => {
        if (loaded) return;
        loaded = true;
        ({ process: monerodProcess, dispose } = load(dependencies));
    };

    const onQuit = async () => {
        const { logger } = global;
        logger.info('monerod', 'Stopping (app quit)');
        // Stop the sync poll first so no status() fetch fires against the killed daemon.
        dispose?.();
        await monerodProcess?.stop();
    };

    return { onLoad, onQuit };
};
