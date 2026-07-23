import { createMemoryHistory } from 'history';

import { createElectronPlatformEncryption } from '@suite/platform-encryption-electron';
import type { CreateLogger } from '@trezor/connect-common';
import { desktopApi } from '@trezor/suite-desktop-api';
import { BridgeTransport } from '@trezor/transport-common';
import { WebUsbTransport } from '@trezor/transport-web';

import { initStore } from 'src/reducers/store';
import { createConnectLoggerFactory } from 'src/support/createConnectLoggerFactory';
import { type PreloadStoreAction } from 'src/support/suite/preloadStore';

/**
 * Composition root for the Tauri shell.
 *
 * Unlike the Electron desktop root, the Tauri webview has no Node main process, so it cannot
 * hand connect a string transport identifier to resolve below an IPC boundary. Instead — like
 * the web app — it constructs real Transport instances here and talks to the local Trezor Bridge
 * (trezor-user-env / trezord) over HTTP. Desktop-only capabilities (metadata files, tray, bridge
 * daemon, http-receiver) are still reachable through `window.desktopApi`, which the Tauri Rust
 * backend provides.
 */
export const createSuiteTauriCompositionRoot = (
    preloadStoreAction?: PreloadStoreAction,
    statePatch?: Record<string, any>,
) => {
    const history = createMemoryHistory();
    // The Tauri Rust backend implements safe-storage/encrypt+decrypt (keychain + AES-256-GCM), so
    // use the same platform encryption as the Electron root rather than the web webauthn stub —
    // otherwise suite-sync owner keys / delegated-identity keys would silently fail to encrypt.
    const platformEncryption = createElectronPlatformEncryption({ desktopApi });
    // Restart the whole process (like the Electron root), not just the webview — resetSuiteAppThunk
    // clears the store and expects the Rust backend (Tor/bridge/http-receiver) to come up clean; a
    // webview-only reload would leave that native state stale.
    const reloadApp = desktopApi.appRestart;

    const getTransportsFactories = () => {
        const TRANSPORT_ID = 'Trezor Suite';

        return {
            BridgeTransport: (createLogger?: CreateLogger) =>
                new BridgeTransport({
                    id: TRANSPORT_ID,
                    logger: createLogger?.('@trezor/transport'),
                }),
            WebUsbTransport: (createLogger?: CreateLogger) =>
                new WebUsbTransport({
                    id: TRANSPORT_ID,
                    logger: createLogger?.('@trezor/transport'),
                }),
        };
    };

    return initStore(
        {
            history,
            platformEncryption,
            createConnectLoggerFactory,
            reloadApp,
            thpHostName: undefined,
            getTransportsFactories,
        },
        preloadStoreAction,
        { statePatch },
    );
};
