import { factoryPublic } from '@trezor/connect-common/src/factory';
import { TrezorConnectDynamic } from '@trezor/connect-common/src/impl/dynamic';
import type {
    ConnectDynamicSettings,
    TrezorConnectPublicAPI,
} from '@trezor/connect-common/src/types';

import { CoreInSuiteDesktop } from './impl/core-in-suite-desktop';
import { CoreInSuiteWeb } from './impl/core-in-suite-web';

const TrezorConnect: TrezorConnectPublicAPI<ConnectDynamicSettings> = factoryPublic(
    new TrezorConnectDynamic({
        implementations: {
            'core-in-suite-desktop': new CoreInSuiteDesktop(),
            'core-in-suite-web': new CoreInSuiteWeb(),
        },
    }),
);

export default TrezorConnect;
export * from '@trezor/connect-common/src/constants';
export * from '@trezor/connect-common/src/events';
export * from '@trezor/connect-common/src/types';
