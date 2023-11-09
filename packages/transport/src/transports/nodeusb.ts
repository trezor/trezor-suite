import { WebUSB } from 'usb';
import { AbstractTransportParams } from './abstract';
import { AbstractUsbTransport } from './abstractUsb';
import { SessionsClient } from '../sessions/client';
import { SessionsBackground } from '../sessions/background';
import { UsbInterface } from '../interfaces/usb';

// notes:
// to make it work on Linux I needed to run `sudo chmod -R 777 /dev/bus/usb/` which is obviously not
// the way to go.

export class NodeUsbTransport extends AbstractUsbTransport {
    public name = 'NodeUsbTransport' as const;

    constructor(params?: AbstractTransportParams) {
        const { messages, logger } = params || {};
        const sessionsBackground = new SessionsBackground();

        // in nodeusb there is no synchronization yet. this is a followup and needs to be decided
        // so far, sessionsClient has direct access to sessionBackground
        const sessionsClient = new SessionsClient({
            requestFn: args => sessionsBackground.handleMessage(args),
            registerBackgroundCallbacks: () => {},
        });

        sessionsBackground.on('descriptors', descriptors => {
            sessionsClient.emit('descriptors', descriptors);
        });

        super({
            messages,
            usbInterface: new UsbInterface({
                usbInterface: new WebUSB({
                    allowAllDevices: true, // return all devices, not only authorized
                }),
                logger,
            }),

            sessionsClient,
        });
    }
}
