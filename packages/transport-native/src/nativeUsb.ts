import { WebUSB } from '@trezor/react-native-usb';
import {
    Transport as AbstractTransport,
    AbstractUsbTransport,
    SessionsClient,
    SessionsBackground,
    UsbInterface,
} from '@trezor/transport';

export class NativeUsbTransport extends AbstractUsbTransport {
    // TODO: Not sure how to solve this type correctly.
    public name = 'NativeUsbTransport' as any;

    constructor({ messages, logger }: ConstructorParameters<typeof AbstractTransport>[0]) {
        const sessionsBackground = new SessionsBackground();

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
