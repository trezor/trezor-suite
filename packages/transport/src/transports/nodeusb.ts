import {
    AbstractApiTransport,
    type AbstractTransportParams,
    UsbApi,
} from '@trezor/transport-common';

import { LazyUsbInterface } from './lazyUsbInterface';

// notes:
// to make it work on Linux I needed to run `sudo chmod -R 777 /dev/bus/usb/` which is obviously not
// the way to go.

export class NodeUsbTransport extends AbstractApiTransport {
    public name = 'NodeUsbTransport' as const;

    constructor(params: AbstractTransportParams) {
        const { logger, debugLink, ...rest } = params;
        // Load the usb addon only on first use (see LazyUsbInterface) instead of importing it at
        // module top level, so merely importing @trezor/transport (as connect's node core does at
        // startup) does not dlopen the native binary. Pairs with the desktop-main externalsType
        // 'node-commonjs' setting, which keeps this import lazy instead of hoisting it into the UMD
        // wrapper.
        const options = { allowAllDevices: true }; // return all devices, not only authorized
        const usbInterface = new LazyUsbInterface(() =>
            import('usb').then(({ WebUSB }) => new WebUSB(options)),
        );

        super({
            api: new UsbApi({
                usbInterface,
                logger,
                debugLink,
            }),
            logger,
            ...rest,
        });
    }
}
