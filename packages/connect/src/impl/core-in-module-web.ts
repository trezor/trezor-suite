import { config } from '@trezor/connect-core/src/data/config';
import { CoreInModule } from '@trezor/connect-core/src/impl/core-in-module';
import { type AbstractTransportParams, BridgeTransport, TRANSPORT } from '@trezor/transport-common';
import { WebUsbTransport } from '@trezor/transport-web';

export class CoreInModuleWeb extends CoreInModule {
    protected defaultTransports(params: AbstractTransportParams) {
        return [new BridgeTransport(params), new WebUsbTransport(params)];
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
