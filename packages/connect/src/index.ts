import type { UpdateConnectSettings } from '@trezor/connect-common';
import { factory } from '@trezor/connect-common';
// Deep import bypasses the `@trezor/transport` barrel so React Native (Metro)
// does not resolve sibling node-only modules (`UdpTransport`/`dgram`,
// `NodeUsbTransport`/`usb`) when react-native consumers reach this file via
// connect's Node entry.
import { BridgeTransport } from '@trezor/transport/src/transports/bridge';
import type { AbstractTransportParams } from '@trezor/transport-common';
import { deepEqual } from '@trezor/utils';

import { reconnectAllBackends } from './backend/BlockchainLink';
import * as settingsStore from './data/settingsStore';
import { CoreInModule } from './impl/core-in-module';

class CoreInModuleNode extends CoreInModule {
    protected defaultTransports(params: AbstractTransportParams) {
        return [new BridgeTransport(params)];
    }

    protected async updateProxy(proxy: UpdateConnectSettings['proxy']) {
        // updateConnectSettings() may be called before init() — nothing to do yet.
        if (!settingsStore.isLoaded()) return;
        const settings = settingsStore.get();
        if (proxy !== undefined && !deepEqual(settings.proxy, proxy)) {
            settingsStore.update({ proxy });
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
