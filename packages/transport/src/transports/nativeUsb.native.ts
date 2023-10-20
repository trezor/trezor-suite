import { WebUSB } from '@trezor/react-native-usb';
import { AbstractTransport } from './abstract';
import { AbstractUsbTransport } from './abstractUsb';
import { SessionsClient } from '../sessions/client';
import { SessionsBackground } from '../sessions/background';
import { UsbInterface } from '../interfaces/usb';

// notes:
// to make it work on Linux I needed to run `sudo chmod -R 777 /dev/bus/usb/` which is obviously not
// the way to go.

export class NativeUsbTransport extends AbstractUsbTransport {
    public name = 'NativeUsbTransport' as const;

    constructor({ messages, logger }: ConstructorParameters<typeof AbstractTransport>[0]) {
        console.log('NativeUsbTransport constructor');
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
                usbInterface: new WebUSB(),
                logger,
            }),

            sessionsClient,
        });
    }
}
