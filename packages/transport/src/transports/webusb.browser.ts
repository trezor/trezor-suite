import { AbstractTransportMethodParams, AbstractTransportParams } from './abstract';
import { AbstractApiTransport } from './abstractApi';
import { UsbApi } from '../api/usb';

import { BrowserSessionsBackground } from '../sessions/background-browser';

const defaultSessionsBackgroundUrl =
    window.location.origin +
    `${process.env.ASSET_PREFIX || ''}/workers/sessions-background-sharedworker.js`
        // just in case so that whoever defines ASSET_PREFIX does not need to worry about trailing slashes
        .replace(/\/+/g, '/');

type WebUsbTransportParams = AbstractTransportParams & { sessionsBackgroundUrl?: string };

/**
 * WebUsbTransport
 * - chrome supported
 * - firefox not supported https://mozilla.github.io/standards-positions/#webusb
 */
export class WebUsbTransport extends AbstractApiTransport {
    public name = 'WebUsbTransport' as const;

    private readonly sessionsBackgroundUrl;

    constructor({ logger, sessionsBackgroundUrl, ...rest }: WebUsbTransportParams) {
        super({
            api: new UsbApi({ usbInterface: navigator.usb, logger }),
            logger,
            ...rest,
        });
        this.sessionsBackgroundUrl = sessionsBackgroundUrl ?? defaultSessionsBackgroundUrl;
    }

    private async trySetSessionsBackground() {
        try {
            const response = await fetch(this.sessionsBackgroundUrl, { method: 'HEAD' });
            if (!response.ok) {
                console.warn(
                    `Failed to fetch sessions-background SharedWorker from url: ${this.sessionsBackgroundUrl}`,
                );
            } else {
                this.sessionsBackground = new BrowserSessionsBackground(this.sessionsBackgroundUrl);
                // sessions client initiated with a request fn facilitating communication with a session backend (shared worker in case of webusb)
                this.sessionsClient.setBackground(this.sessionsBackground);
            }
        } catch (err) {
            console.warn(
                'Unable to load background-sharedworker. Falling back to use local module. Say bye bye to tabs synchronization. Error details: ',
                err.message,
            );
        }
    }

    public async init({ signal }: AbstractTransportMethodParams<'init'> = {}) {
        await this.trySetSessionsBackground();

        return super.init({ signal });
    }

    public listen() {
        this.api.listen();

        return super.listen();
    }
}
