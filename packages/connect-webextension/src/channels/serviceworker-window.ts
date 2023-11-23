import {
    AbstractMessageChannel,
    AbstractMessageChannelConstructorParams,
    Message,
} from '@trezor/connect-common/src/messageChannel/abstract';

/**
 * Communication channel between:
 * - here: chrome message port (in service worker)
 * - peer: window.onMessage in trezor-content-script
 */
export class ServiceWorkerWindowChannel<
    IncomingMessages extends { type: string },
> extends AbstractMessageChannel<IncomingMessages> {
    private port: chrome.runtime.Port | undefined;

    constructor({
        name,
        channel,
        logger,
    }: Pick<AbstractMessageChannelConstructorParams, 'channel' | 'logger'> & { name: string }) {
        super({
            channel,
            sendFn: (message: any) => {
                console.log('message in ServiceWorkerWindowChannel sendFn', message);
                if (!this.port) throw new Error('port not assigned');
                this.port.postMessage(message);
            },
            logger,
        });

        chrome.runtime.onConnect.addListener(port => {
            console.log('addListener in ServiceWorkerWindowChannel');
            console.log('port', port);
            if (port.name !== name) return;
            this.port = port;

            this.port.onMessage.addListener((message: Message<IncomingMessages>, { sender }) => {
                if (!sender) {
                    this.logger?.error('service-worker-window', 'no sender');
                    return;
                }

                const { origin } = sender;
                console.log('origin', origin);

                const whitelist = [
                    'https://connect.trezor.io',
                    'https://staging-connect.trezor.io',
                    'https://suite.corp.sldev.cz',
                    'http://localhost:8088',
                ];

                if (!origin) {
                    this.logger?.error(
                        'connect-webextension/messageChannel/extensionPort/onMessage',
                        'no origin',
                    );

                    return;
                }
                if (!whitelist.includes(origin)) {
                    this.logger?.error(
                        'connect-webextension/messageChannel/extensionPort/onMessage',
                        'origin not whitelisted',
                        origin,
                    );
                    return;
                }

                // eslint-disable-next-line no-restricted-globals
                if (origin === self.origin) {
                    return;
                }

                this.onMessage(message);
            });
        });
    }

    disconnect() {
        this.port?.disconnect();
    }
}
