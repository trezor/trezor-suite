import { AbstractTransportMethodParams, AbstractTransportParams } from './abstract';
import { AbstractApiTransport } from './abstractApi';
import { UsbApi } from '../api/usb';
import { BrowserSessionsBackground } from '../sessions/background-browser';

const defaultSessionsBackgroundUrl =
    'https://connect.trezor.io/9/workers/sessions-background-sharedworker.js';

type WebUsbTransportParams = AbstractTransportParams & { sessionsBackgroundUrl?: string };

/**
 * WebUsbTransport
 * - chrome supported
 * - firefox not supported https://mozilla.github.io/standards-positions/#webusb
 */
export class WebUsbTransport extends AbstractApiTransport {
    public name = 'WebUsbTransport' as const;
    public apiType = 'usb' as const;

    private readonly sessionsBackgroundUrl: string | null = defaultSessionsBackgroundUrl;

    constructor({ logger, sessionsBackgroundUrl, ...rest }: WebUsbTransportParams) {
        super({
            api: new UsbApi({ usbInterface: navigator.usb, logger }),
            logger,
            ...rest,
        });
        if (sessionsBackgroundUrl || sessionsBackgroundUrl === null) {
            this.sessionsBackgroundUrl = sessionsBackgroundUrl;
        }
    }

    private async trySetSessionsBackground() {
        if (!this.sessionsBackgroundUrl) {
            this.logger?.log(
                'No sessionsBackgroundUrl provided. Falling back to use local module.',
            );

            return;
        }
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
}
