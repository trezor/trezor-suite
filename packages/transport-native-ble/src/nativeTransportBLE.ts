import {
    Transport as AbstractTransport,
    AbstractApiTransport,
    SessionsClient,
    SessionsBackground,
} from '@trezor/transport';

import { BleApi } from './api/bleApi';

export class NativeTransportBLE extends AbstractApiTransport {
    public name = 'NativeTransportBLE' as any;

    constructor(params?: ConstructorParameters<typeof AbstractTransport>[0]) {
        const { messages, logger } = params || {};
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
            api: new BleApi({
                logger,
            }),
            logger,
            sessionsClient,
        });
    }
}
