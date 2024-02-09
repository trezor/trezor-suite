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
    private name: string;
    private allowSelfOrigin: boolean;
    private currentId?: () => number | undefined;

    constructor({
        name,
        channel,
        logger,
        lazyHandshake,
        legacyMode,
        allowSelfOrigin = false,
        currentId,
    }: Pick<
        AbstractMessageChannelConstructorParams,
        'channel' | 'logger' | 'lazyHandshake' | 'legacyMode'
    > & {
        name: string;
        allowSelfOrigin?: boolean;
        currentId?: () => number | undefined;
    }) {
        super({
            channel,
            sendFn: (message: any) => {
                if (!this.port) throw new Error('port not assigned');
                this.port.postMessage(message);
            },
            logger,
            lazyHandshake,
            legacyMode,
        });
        this.name = name;
        this.allowSelfOrigin = allowSelfOrigin;
        this.currentId = currentId;
        this.connect();
    }

    connect() {
        chrome.runtime.onConnect.addListener(port => {
            if (port.name !== this.name) return;
            // Ignore port if name does match, but port created by different popup
            if (this.currentId?.() && this.currentId?.() !== port.sender?.tab?.id) return;

            this.port = port;
            this.port.onMessage.addListener((message: Message<IncomingMessages>, { sender }) => {
                if (!sender) {
                    this.logger?.error('service-worker-window', 'no sender');
                    return;
                }

                const { origin } = sender;
                const whitelist = [
                    'https://connect.trezor.io',
                    'https://staging-connect.trezor.io',
                    'https://suite.corp.sldev.cz',
                    'http://localhost:8088',
                ];

                // If service worker is running in web extension and other env of this webextension
                // want to communicate with service worker it should be whitelisted.
                const webextensionId = chrome?.runtime?.id;
                if (webextensionId) {
                    whitelist.push(`chrome-extension://${webextensionId}`);
                }

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

                // TODO: not completely sure that is necessary to prevent self origin communication sometimes.
                if (origin === self.origin && !this.allowSelfOrigin) {
                    return;
                }

                this.onMessage(message);
            });
        });
        this.isConnected = true;
    }

    disconnect() {
        if (!this.isConnected) return;
        this.port?.disconnect();
        this.clear();
        this.isConnected = false;
    }
}
