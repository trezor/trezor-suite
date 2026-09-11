import {
    type TrezorConnectPrivilegedAPI,
    type UpdateConnectSettings,
    factoryPrivileged,
} from '@trezor/connect-common';
import { type AbstractTransportParams, BridgeTransport } from '@trezor/transport-common';

import { updateProxy } from './backend/BlockchainLink';
import { CoreInModule } from './impl/core-in-module';

class CoreInModuleNode extends CoreInModule {
    protected defaultTransports(params: AbstractTransportParams) {
        return [new BridgeTransport(params)];
    }

    protected async updateProxy(proxy: UpdateConnectSettings['proxy']) {
        await updateProxy(proxy);
    }
}

const TrezorConnect: TrezorConnectPrivilegedAPI = factoryPrivileged(new CoreInModuleNode());

export default TrezorConnect;

// allowed only here
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
export * from './exports';
