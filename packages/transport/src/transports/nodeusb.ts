import { WebUSB } from 'usb';

import { Transport } from './abstract';
import { UsbTransport } from './usb';
import { SessionsClient } from '../sessions/client';

import { SessionsBackground } from '../sessions/background';

const sessionsBackground = new SessionsBackground();

// in nodeusb there is no synchronization yet. this is a followup and needs to be decided
// so far, sessionsClient has direct access to sessionBackground
const sessionsClient = new SessionsClient({
    requestFn: params => sessionsBackground.handleMessage(params),
    registerCallbackOnDescriptorsChange: () => {},
});

sessionsBackground.on('descriptors', descriptors => {
    sessionsClient.emit('descriptors', descriptors);
});

// notes:
// to make it work I needed to run `sudo chmod -R 777 /dev/bus/usb/`

export class NodeUsbTransport extends UsbTransport {
    constructor({ messages }: ConstructorParameters<typeof Transport>[0] = {}) {
        super({
            messages,
            usbInterface: new WebUSB({
                allowAllDevices: true, // return all devices, not only authorized
            }),
            sessionsClient,
        });
        this.name = 'NodeUsbTransport';
    }
}
