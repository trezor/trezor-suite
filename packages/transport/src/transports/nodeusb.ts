import { WebUSB } from 'usb';

import {
    AbstractApiTransport,
    type AbstractTransportParams,
    UsbApi,
} from '@trezor/transport-abstract';

// notes:
// to make it work on Linux I needed to run `sudo chmod -R 777 /dev/bus/usb/` which is obviously not
// the way to go.

export class NodeUsbTransport extends AbstractApiTransport {
    public name = 'NodeUsbTransport' as const;

    constructor(params: AbstractTransportParams) {
        const { logger, debugLink, ...rest } = params;

        super({
            api: new UsbApi({
                usbInterface: new WebUSB({
                    allowAllDevices: true, // return all devices, not only authorized
                }),
                logger,
                debugLink,
            }),
            logger,
            ...rest,
        });
    }
}
