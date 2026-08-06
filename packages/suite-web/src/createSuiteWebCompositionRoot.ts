import { createBrowserHistory } from 'history';

import { createWebauthnPlatformEncryption } from '@suite/platform-encryption-webauthn';
import { asGetter } from '@suite-common/dependency-injection';
import type { CreateLogger } from '@trezor/connect-common';
import { resolveConnectPath } from '@trezor/env-utils';
import { BridgeTransport } from '@trezor/transport-common';
import { WebUsbTransport } from '@trezor/transport-web';

import { initStore } from 'src/reducers/store';
import { createConnectLoggerFactory } from 'src/support/createConnectLoggerFactory';
import { type CreateGetBinFilesBaseUrl } from 'src/support/createGetBinFilesBaseUrl';
import { type PreloadStoreAction } from 'src/support/suite/preloadStore';

import { getWebThpHostName } from './support/getWebThpHostName';

const createGetBinFilesBaseUrl: CreateGetBinFilesBaseUrl<unknown> = () =>
    asGetter(() => resolveConnectPath('data'));

export const createSuiteWebCompositionRoot = (preloadStoreAction?: PreloadStoreAction) => {
    const history = createBrowserHistory();
    const platformEncryption = createWebauthnPlatformEncryption();
    const reloadApp = () => window.location.reload();

    const getTransportsFactories = () => {
        // Pure DI: connect expects ready-made Transport instances, so the host constructs
        // them here. `id` becomes the Bridge session owner shown to the user; it mirrors
        // the web manifest's `appName` (see packages/suite/src/support/extraDependencies.ts).
        const TRANSPORT_ID = 'Trezor Suite web';

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
            createGetBinFilesBaseUrl,
            reloadApp,
            thpHostName: getWebThpHostName(),
            getTransportsFactories,
        },
        preloadStoreAction,
    );
};
