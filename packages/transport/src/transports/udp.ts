import { AbstractTransport } from './abstract';

import { UdpInterface } from '../interfaces/udp';
import { AbstractUsbTransport } from './abstractUsb';

import { SessionsClient } from '../sessions/client';
import { SessionsBackground } from '../sessions/background';

type UdpConstructorParameters = ConstructorParameters<typeof AbstractTransport>[0] & {};
export class UdpTransport extends AbstractUsbTransport {
    public name = 'UdpTransport' as const;

    constructor({ messages, logger }: UdpConstructorParameters) {
        const sessionsBackground = new SessionsBackground();

        // in udp there is no synchronization yet. it depends where this transport runs (node or browser)
        const sessionsClient = new SessionsClient({
            requestFn: args => sessionsBackground.handleMessage(args),
            registerBackgroundCallbacks: () => {},
        });

        sessionsBackground.on('descriptors', descriptors => {
            sessionsClient.emit('descriptors', descriptors);
        });

        super({
            messages,
            // @ts-expect-error
            usbInterface: new UdpInterface({ logger }),
            logger,

            sessionsClient,
        });

        const enumerateRecursive = () => {
            setTimeout(() => {
                this.enumerate().promise.finally(enumerateRecursive);
            }, 500);
        };
        enumerateRecursive();
    }
}
