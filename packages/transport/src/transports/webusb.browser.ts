import { AbstractTransportMethodParams, AbstractTransportParams } from './abstract';
import { AbstractApiTransport } from './abstractApi';
import { UsbApi } from '../api/usb';

import { initBackgroundInBrowser } from '../sessions/background-browser';

type WebUsbTransportParams = AbstractTransportParams & { sessionsBackgroundUrl?: string };

/**
 * WebUsbTransport
 * - chrome supported
 * - firefox not supported https://mozilla.github.io/standards-positions/#webusb
 */
export class WebUsbTransport extends AbstractApiTransport {
    public name = 'WebUsbTransport' as const;

    private readonly sessionsBackgroundUrl;

    constructor({ messages, logger, sessionsBackgroundUrl }: WebUsbTransportParams) {
        super({
            messages,
            api: new UsbApi({
                usbInterface: navigator.usb,
                logger,
            }),
            logger,
        });
        this.sessionsBackgroundUrl = sessionsBackgroundUrl;
    }

    public init({ signal }: AbstractTransportMethodParams<'init'> = {}) {
        return this.scheduleAction(
            async () => {
                const { sessionsBackgroundUrl } = this;
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
            },
            { signal },
        );
    }

    public listen() {
        this.api.listen();

        return super.listen();
    }
}
