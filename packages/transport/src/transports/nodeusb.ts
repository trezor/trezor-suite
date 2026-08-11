import { WebUSB } from 'usb';

import {
    AbstractApiTransport,
    type AbstractTransportParams,
    UsbApi,
    type UsbInterfaceApi,
} from '@trezor/transport-common';

// notes:
// to make it work on Linux I needed to run `sudo chmod -R 777 /dev/bus/usb/` which is obviously not
// the way to go.

export class NodeUsbTransport extends AbstractApiTransport {
    public name = 'NodeUsbTransport' as const;

    constructor(params: AbstractTransportParams) {
        const { logger, debugLink, ...rest } = params;

        super({
            api: new UsbApi({
                // `usb` v3 (node-usb-rs) attaches `transferIn`/`transferOut` to the device
                // prototype at runtime, but marks them "hidden" so they are absent from the
                // published `.d.ts` unless the DOM `USBDevice` lib is loaded. WebUSB still
                // satisfies `UsbInterfaceApi` structurally at runtime, so cast to keep the
                // DOM-free typing of `@trezor/transport-common`.
                usbInterface: new WebUSB({
                    allowAllDevices: true, // return all devices, not only authorized
                }) as unknown as UsbInterfaceApi,
                logger,
                debugLink,
            }),
            logger,
            ...rest,
        });
    }
}
