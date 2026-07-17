import {
    ERRORS,
    type TrezorConnectPrivilegedAPI,
    type UpdateConnectSettings,
    factoryPrivileged,
} from '@trezor/connect-common';
import { type AbstractTransportParams, BridgeTransport, TRANSPORT } from '@trezor/transport-common';
import { WebUsbTransport } from '@trezor/transport-web';

import { config } from './data/config';
import { CoreInModule } from './impl/core-in-module';

type TrezorConnectBrowserAPI = TrezorConnectPrivilegedAPI & {
    requestWebUSBDevice: () => Promise<void>;
};

class CoreInModuleWeb extends CoreInModule {
    protected defaultTransports(params: AbstractTransportParams) {
        return [new BridgeTransport(params), new WebUsbTransport(params)];
    }

    protected updateProxy(proxy: UpdateConnectSettings['proxy']) {
        if (proxy !== undefined) {
            throw ERRORS.TypedError(
                'Method_InvalidPackage',
                'proxy setting is not supported in web environment',
            );
        }

        return Promise.resolve();
    }

    async requestWebUSBDevice() {
        try {
            await window.navigator.usb.requestDevice({ filters: config.webusb });
            this.handleCoreMessage({ type: TRANSPORT.REQUEST_DEVICE });
        } catch {
            // empty
        }
    }
}

// Exported to enable using directly
const TrezorConnect: TrezorConnectBrowserAPI = factoryPrivileged(new CoreInModuleWeb());

export default TrezorConnect;

// allowed only here
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
export * from './exports';

if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
        TrezorConnect.dispose();
    });
}
