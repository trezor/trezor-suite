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

export class WindowServiceWorkerChannel<
    IncomingMessages extends { type: string },
> extends AbstractMessageChannel<IncomingMessages> {
    private port: chrome.runtime.Port | undefined;

    constructor({
        name,
        channel,
    }: Pick<AbstractMessageChannelConstructorParams, 'channel'> & { name: string }) {
        super({
            channel,
            sendFn: (message: any) => {
                if (!this.port) throw new Error('port not assigned');
                this.port.postMessage(message);
            },
        });

        const port = chrome.runtime.connect({ name });
        this.port = port;
        this.connect();
    }

    connect() {
        this.port?.onMessage.addListener(
            (
                // note: portMessageEvent has message typed as any
                message: Message<IncomingMessages>,
            ) => {
                if (message.channel.here === this.channel.here) return;
                this.onMessage(message);
            },
        );
        this.isConnected = true;
    }

    disconnect() {
        if (!this.isConnected) return;
        this.port?.disconnect();
        this.isConnected = false;
    }
}
