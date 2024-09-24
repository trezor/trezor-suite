import { WebUSB } from 'usb';
import { AbstractTransportParams } from './abstract';
import { AbstractApiTransport } from './abstractApi';
import { SessionsBackground } from '../sessions/background';
import { UsbApi } from '../api/usb';

// notes:
// to make it work on Linux I needed to run `sudo chmod -R 777 /dev/bus/usb/` which is obviously not
// the way to go.

export class NodeUsbTransport extends AbstractApiTransport {
    public name = 'NodeUsbTransport' as const;

    private readonly sessionsBackground = new SessionsBackground();

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

    public init() {
        return this.scheduleAction(async () => {
            // in nodeusb there is no synchronization yet. this is a followup and needs to be decided
            // so far, sessionsClient has direct access to sessionBackground
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

        return super.listen();
    }

    public stop() {
        super.stop();
        this.sessionsBackground.dispose();
    }
}
