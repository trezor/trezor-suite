import { ERRORS } from '@trezor/connect-common/src/constants';

import { config } from './data/config';
import { TRANSPORT } from './events';
import { factory } from './factory';
import { CoreInModule } from './impl/core-in-module';
import type { UpdateConnectSettings } from './types/api/updateConnectSettings';

class CoreInModuleWeb extends CoreInModule {
    protected get defaultTransports() {
        return ['BridgeTransport' as const, 'WebUsbTransport' as const];
    }

    updateProxy(proxy: UpdateConnectSettings['proxy']) {
        if (proxy !== undefined) {
            throw ERRORS.TypedError(
                'Method_InvalidPackage',
                'proxy setting is not supported in web environment',
            );
        }

        return Promise.resolve();
    }

    disableWebUSB() {
        this.handleCoreMessage({ type: TRANSPORT.DISABLE_WEBUSB });
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

const impl = new CoreInModuleWeb();

// Exported to enable using directly
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
    {
        disableWebUSB: impl.disableWebUSB.bind(impl),
        requestWebUSBDevice: impl.requestWebUSBDevice.bind(impl),
    },
);

export default TrezorConnect;

// allowed only here
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
export * from './exports';

if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
        impl.dispose();
    });
}
