import {
    type ElectronMainOptions,
    IPCMode,
    captureConsoleIntegration,
    init,
} from '@sentry/electron/main';
import { session } from 'electron';

import { SENTRY_CONFIG } from '@suite/sentry';
import { TorStatus } from '@suite/tor-types';

import type { Store } from './store';
import type { MainThreadEmitter } from '../modules';

interface InitSentryParams {
    mainThreadEmitter: MainThreadEmitter;
    store: Store;
}

const ELECTRON_MAIN_SENTRY_CONFIG = {
    ...SENTRY_CONFIG,
    // Important: must be a function to keep default Sentry integrations; an array would mean ONLY those specific integrations.
    integrations: defaults => [
        ...defaults.filter(i => i.name !== 'MainProcessSession'),
        captureConsoleIntegration({ levels: ['error'] }),
    ],

    ipcMode: IPCMode.Classic,
    getSessions: () => [session.defaultSession],
    // Required for renderer (browser) profiling: the renderer collects profiles via
    // browserProfilingIntegration and ships them to the main process over IPC, but they are
    // only re-attached to transaction envelopes (and thus actually sent to Sentry) when the
    // main process runs rendererProfilingIntegration, which is added by this flag. Enabling it
    // also makes the SDK inject the `Document-Policy: js-profiling` response header required by
    // the JS Self-Profiling API into every session returned by getSessions().
    enableRendererProfiling: true,
} as ElectronMainOptions;

export const initSentry = ({ mainThreadEmitter, store }: InitSentryParams) => {
    let torStatus = TorStatus.Enabling;

    mainThreadEmitter.on('module/tor-status-update', (newStatus: TorStatus) => {
        torStatus = newStatus;
    });

    const transportOptions = {
        // If Tor is enabled but not running, don't send the event but put it in a queue.
        // Queue can be inspected in @trezor/suite-desktop/sentry/queue folder.
        shouldSend: () => !(store.getTorSettings().running && torStatus !== TorStatus.Enabled),
    };

    // Sentry ignore userPath change by environment so even in local build it uses @trezor/suite-desktop/sentry folder.
    init({ ...ELECTRON_MAIN_SENTRY_CONFIG, transportOptions });
};
