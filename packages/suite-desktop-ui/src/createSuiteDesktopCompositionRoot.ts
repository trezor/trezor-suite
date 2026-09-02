import { createMemoryHistory } from 'history';

import { createElectronPlatformEncryption } from '@suite/platform-encryption-electron';
import { toGetter } from '@suite-common/dependency-injection';
import { desktopApi } from '@trezor/suite-desktop-api';

import { type AppState, initStore } from 'src/reducers/store';
import { type CreateGetBinFilesBaseUrl } from 'src/support/createGetBinFilesBaseUrl';
import { type PreloadStoreAction } from 'src/support/suite/preloadStore';

const createGetBinFilesBaseUrl: CreateGetBinFilesBaseUrl<AppState> = ({ getState }) =>
    toGetter(getState, state => state.desktop?.paths?.binDir);

export const createSuiteDesktopCompositionRoot = (
    preloadStoreAction?: PreloadStoreAction,
    statePatch?: Record<string, any>,
) => {
    const history = createMemoryHistory();
    const platformEncryption = createElectronPlatformEncryption({ desktopApi });
    const reloadApp = desktopApi.appRestart;

    // The desktop renderer can't construct node-only transports (`usb`/`dgram`), so each factory
    // yields the identifier string; the main process (`@trezor/suite-desktop-core`'s
    // trezor-connect.ts) maps it to a real Transport instance below the IPC boundary. This also
    // keeps `@trezor/transport` out of the renderer bundle.
    const getTransportsFactories = () => ({
        BridgeTransport: () => 'BridgeTransport' as const,
        NodeUsbTransport: () => 'NodeUsbTransport' as const,
        UdpTransport: () => 'UdpTransport' as const,
    });

    return initStore(
        {
            history,
            platformEncryption,
            createConnectLoggerFactory: undefined,
            createGetBinFilesBaseUrl,
            reloadApp,
            thpHostName: undefined,
            getTransportsFactories,
        },
        preloadStoreAction,
        { statePatch },
    );
};
