/**
 * Experimental: verifies the on-chain nonce of the selected Ethereum account through a bundled
 * Colibri light-client verifier that runs in its own utility process.
 */
import { app } from 'electron';

import { getStorageDirectory, mainnetTrustManifest } from '@suite/colibri-nonce-verifier';

import { ipcMain } from '../ipcMain';
import type { ModuleInit } from './module';
import { ThreadProxy } from '../libs/thread-proxy';
import {
    type VerifierWorker,
    createVerifiedNonceController,
} from '../libs/verified-nonce-controller';
import type {
    ColibriNonceVerifierLogEvent,
    ColibriNonceVerifierThread,
} from '../threads/colibri-nonce-verifier';

export const SERVICE_NAME = 'verified-nonce';

const THREAD_NAME = 'colibri-nonce-verifier';

export const init: ModuleInit = ({ mainWindowProxy, mainThreadEmitter, store }) => {
    const { logger } = global;

    const startWorker = async (): Promise<VerifierWorker> => {
        const storageDirectory = getStorageDirectory({
            appDataDirectory: app.getPath('userData'),
            chainId: mainnetTrustManifest.chainId,
            trustPolicyId: mainnetTrustManifest.policyId,
        });
        if (!storageDirectory) throw new Error('trust policy id is not a valid directory name');

        const proxy = new ThreadProxy<ColibriNonceVerifierThread>({ name: THREAD_NAME });
        await proxy.run({ storageDirectory, torSettings: store.getTorSettings() });
        proxy.subscribe('log', ({ level, message }: ColibriNonceVerifierLogEvent) =>
            logger[level](SERVICE_NAME, message),
        );
        proxy.subscribe('interceptor', event =>
            mainThreadEmitter.emit('module/request-interceptor', event),
        );
        const unsubscribeTorSettingsChange = store.onTorSettingsChange(torSettings =>
            proxy.request('setTorSettings', [torSettings]).catch(() => undefined),
        );
        proxy.watch('disposed', unsubscribeTorSettingsChange);

        return {
            verify: request => proxy.request('verify', [request]),
            getInfo: () => proxy.request('getInfo', []),
            cancel: requestId => proxy.request('cancel', [requestId]),
            dispose: () => proxy.dispose(),
            watchExit: listener => proxy.watch('exited', listener),
        };
    };

    const controller = createVerifiedNonceController({
        startWorker,
        logger: { warn: message => logger.warn(SERVICE_NAME, message) },
    });

    ipcMain.handle('verified-nonce/get-info', () => controller.getInfo());
    ipcMain.handle('verified-nonce/verify', (_, request) => controller.verify(request));
    ipcMain.handle('verified-nonce/cancel', (_, payload) => controller.cancel(payload?.requestId));

    mainWindowProxy.on('init', mainWindow => {
        mainWindow.webContents.on('did-start-loading', controller.dispose);
    });
    ipcMain.once('app/restart', controller.dispose);

    // The worker is started lazily by the first verification, so there is nothing to load.
    return { onLoad: () => undefined, onQuit: controller.dispose };
};
