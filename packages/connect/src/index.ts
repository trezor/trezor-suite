import {
    type TrezorConnectPrivilegedAPI,
    type UpdateConnectSettings,
    factoryPrivileged,
} from '@trezor/connect-common';
import { type AbstractTransportParams, BridgeTransport } from '@trezor/transport-common';

import { reconnectAllBackends } from './backend/BlockchainLink';
import { CoreInModule } from './impl/core-in-module';

class CoreInModuleNode extends CoreInModule {
    protected defaultTransports(params: AbstractTransportParams) {
        return [new BridgeTransport(params)];
    }

    protected async updateProxy(proxy: UpdateConnectSettings['proxy']) {
        if (proxy !== undefined) {
            // Routing is handled by the request interceptor; reconnect so
            // existing connections switch to the new Tor state.
            await reconnectAllBackends();
        }
    }
}

const TrezorConnect: TrezorConnectPrivilegedAPI = factoryPrivileged(new CoreInModuleNode());

export default TrezorConnect;

// allowed only here
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
export * from './exports';
