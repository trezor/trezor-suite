import { AbstractTransportParams } from './abstract';
import { AbstractApiTransport } from './abstractApi';
import { SessionsClient } from '../sessions/client';
import { UsbApi } from '../api/usb';

import { initBackgroundInBrowser } from '../sessions/background-browser';

/**
 * WebUsbTransport
 * - chrome supported
 * - firefox not supported https://mozilla.github.io/standards-positions/#webusb
 */
export class WebUsbTransport extends AbstractApiTransport {
    public name = 'WebUsbTransport' as const;

    constructor(params?: AbstractTransportParams) {
        const { messages, logger } = params || {};
        const { requestFn, registerBackgroundCallbacks } = initBackgroundInBrowser();

        super({
            messages,
            api: new UsbApi({
                usbInterface: navigator.usb,
                logger,
            }),

            // sessions client with a request fn facilitating communication with a session backend (shared worker in case of webusb)
            sessionsClient: new SessionsClient({
                // @ts-expect-error
                requestFn,
                registerBackgroundCallbacks,
            }),
        });
    }
}
