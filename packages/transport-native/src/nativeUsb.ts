import { WebUSB } from '@trezor/react-native-usb';
import {
    Transport as AbstractTransport,
    AbstractApiTransport,
    SessionsBackground,
    UsbApi,
} from '@trezor/transport';

export class NativeUsbTransport extends AbstractApiTransport {
    // TODO: Not sure how to solve this type correctly.
    public name = 'NativeUsbTransport' as any;

    private readonly sessionsBackground = new SessionsBackground();

    constructor(params: ConstructorParameters<typeof AbstractTransport>[0]) {
        const { messages, logger } = params;

        super({
            messages,
            api: new UsbApi({
                usbInterface: new WebUSB(),
                logger,
            }),
        });
    }

    public init() {
        return this.scheduleAction(async () => {
            // in NativeUsbTransport there is no synchronization and probably never will be.
            // sessionsClient is talking to sessionsBackground directly
            this.sessionsClient.init({
                requestFn: args => this.sessionsBackground.handleMessage(args),
                registerBackgroundCallbacks: () => {},
            });

            this.sessionsBackground.on('descriptors', descriptors => {
                this.sessionsClient.emit('descriptors', descriptors);
            });

            const handshakeRes = await this.sessionsClient.handshake();
            this.stopped = !handshakeRes.success;

            return handshakeRes;
        });
    }

    public listen() {
        this.api.listen();
        this.sessionsBackground.dispose();

        return super.listen();
    }
}
