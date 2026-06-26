import { type UpdateConnectSettings, factoryPrivileged } from '@trezor/connect-common';

import { updateProxy } from './backend/BlockchainLink';
import { CoreInModule } from './impl/core-in-module';

class CoreInModuleNode extends CoreInModule {
    protected get defaultTransports() {
        return ['BridgeTransport' as const];
    }

    protected async updateProxy(proxy: UpdateConnectSettings['proxy']) {
        await updateProxy(proxy);
    }
}

const TrezorConnect = factoryPrivileged(new CoreInModuleNode());

export default TrezorConnect;

// allowed only here
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
export * from './exports';
