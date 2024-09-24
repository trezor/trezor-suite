import { AbstractTransportParams } from './abstract';
import { AbstractApiTransport } from './abstractApi';
import { UsbApi } from '../api/usb';

import { initBackgroundInBrowser } from '../sessions/background-browser';

/**
 * WebUsbTransport
 * - chrome supported
 * - firefox not supported https://mozilla.github.io/standards-positions/#webusb
 */
export class WebUsbTransport extends AbstractApiTransport {
    public name = 'WebUsbTransport' as const;

    constructor(params: AbstractTransportParams) {
        const { messages, logger } = params;

        super({
            messages,
            api: new UsbApi({
                usbInterface: navigator.usb,
                logger,
            }),
            logger,
        });
    }

    public init({ sessionsBackgroundUrl }: { sessionsBackgroundUrl: string }) {
        return this.scheduleAction(async () => {
            const { requestFn, registerBackgroundCallbacks } =
                await initBackgroundInBrowser(sessionsBackgroundUrl);
            // sessions client initiated with a request fn facilitating communication with a session backend (shared worker in case of webusb)
            this.sessionsClient.init({
                requestFn,
                registerBackgroundCallbacks,
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
}
