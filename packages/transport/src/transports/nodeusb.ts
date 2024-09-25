import { WebUSB } from 'usb';
import { AbstractTransportParams } from './abstract';
import { AbstractApiTransport } from './abstractApi';
import { UsbApi } from '../api/usb';

// notes:
// to make it work on Linux I needed to run `sudo chmod -R 777 /dev/bus/usb/` which is obviously not
// the way to go.

export class NodeUsbTransport extends AbstractApiTransport {
    public name = 'NodeUsbTransport' as const;

    constructor(params: AbstractTransportParams) {
        const { messages, logger, debugLink } = params;

        super({
            messages,
            api: new UsbApi({
                usbInterface: new WebUSB({
                    allowAllDevices: true, // return all devices, not only authorized
                }),
                logger,
                debugLink,
            }),
        });
    }

    public listen() {
        this.api.listen();

        return super.listen();
    }
}
