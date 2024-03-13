import {
    Transport as AbstractTransport,
    AbstractApiTransport,
    SessionsClient,
    SessionsBackground,
} from '@trezor/transport';

import { BluetoothApi } from './api/bluetoothApi';

export class NativeBluetoothTransport extends AbstractApiTransport {
    // TODO: Not sure how to solve this type correctly.
    public name = 'NativeUsbTransport' as any;

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
            api: new BluetoothApi({
                logger,
            }),

            sessionsClient,
        });
    }
}
