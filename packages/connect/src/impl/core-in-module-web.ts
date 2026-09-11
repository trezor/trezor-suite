import { ERRORS, type UpdateConnectSettings } from '@trezor/connect-common';
import { config } from '@trezor/connect-core/src/data/config';
import { CoreInModule } from '@trezor/connect-core/src/impl/core-in-module';
import { type AbstractTransportParams, BridgeTransport, TRANSPORT } from '@trezor/transport-common';
import { WebUsbTransport } from '@trezor/transport-web';

export class CoreInModuleWeb extends CoreInModule {
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
