import { deepEqual } from '@trezor/utils';

import { reconnectAllBackends } from './backend/BlockchainLink';
import { DataManager } from './data/DataManager';
import { factory } from './factory';
import { CoreInModule } from './impl/core-in-module';
import type { UpdateConnectSettings } from './types/api/updateConnectSettings';

class CoreInModuleNode extends CoreInModule {
    protected get defaultTransports() {
        return ['BridgeTransport' as const];
    }

    protected async updateProxy(proxy: UpdateConnectSettings['proxy']) {
        const settings = DataManager.getSettings();
        if (proxy !== undefined && !deepEqual(settings.proxy, proxy)) {
            DataManager.updateSettings({ proxy });
            await reconnectAllBackends();
        }
    }
}

const impl = new CoreInModuleNode();

const TrezorConnect = factory(
    {
        eventEmitter: impl.eventEmitter,
        init: impl.init.bind(impl),
        call: impl.call.bind(impl),
        updateConnectSettings: impl.updateConnectSettings.bind(impl),
        uiResponse: impl.uiResponse.bind(impl),
        cancel: impl.cancel.bind(impl),
        dispose: impl.dispose.bind(impl),
    },
    {},
);

export default TrezorConnect;

// allowed only here
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
export * from './exports';
