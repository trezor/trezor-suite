import {
    AbstractMessageChannel,
    AbstractMessageChannelConstructorParams,
    // Message,
} from '@trezor/connect-common/src/messageChannel/abstract';

/**
 * Communication channel between:
 * - here: chrome message port (in service worker)
 * - peer: window.onMessage in trezor-content-script
 */

export class WindowWindowChannel<
    IncomingMessages extends { type: string },
> extends AbstractMessageChannel<IncomingMessages> {
    constructor({
        // name,
        channel,
    }: Pick<AbstractMessageChannelConstructorParams, 'channel'> & { name: string }) {
        super({
            channel,
            sendFn: (message: any) => {
                console.log('window window sending', message)
                window.postMessage(message);
            },
        });

        window.addEventListener('message', (message: MessageEvent<IncomingMessages>) => {
            console.log('window window message received', message);
            // @ts-ignore
            this.onMessage(message);
        });
    }

    disconnect() {
        // window.removeEventListener('message', this.onMessage);
    }
}
