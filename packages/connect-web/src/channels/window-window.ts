import {
    AbstractMessageChannel,
    AbstractMessageChannelConstructorParams,
    Message,
} from '@trezor/connect-common/src/messageChannel/abstract';

/**
 * Communication channel between:
 * - here: window.postMessage
 * - peer: window.onMessage
 */

export class WindowWindowChannel<
    IncomingMessages extends {
        type: string;
        channel?: { peer: string; here: string };
        payload?: any;
    },
> extends AbstractMessageChannel<IncomingMessages> {
    _windowHere: Window;
    _listener: typeof WindowWindowChannel.prototype.listener;

    constructor({
        windowHere,
        windowPeer,
        channel,
        logger,
    }: Pick<AbstractMessageChannelConstructorParams, 'channel' | 'logger'> & {
        windowHere: Window;
        // specific peer can change over time, for example when different popup is opened
        // therefore it's a function that returns the current peer
        windowPeer: () => Window | undefined;
    }) {
        super({
            channel,
            sendFn: (message: any) => {
                windowPeer()?.postMessage(message);
            },
            logger,
        });

        this._listener = this.listener.bind(this);
        this._windowHere = windowHere;
        this.connect();
    }

    listener(event: MessageEvent<Message<IncomingMessages>>) {
        const message = {
            ...event.data,
            success: true,
            origin: event.origin,
            payload: event.data.payload || {},
            // This is added for compatibility when communicating with iframe/popup that doesn't have channel defined yet
            channel: event.data.channel || {
                peer: this.channel.here,
                here: this.channel.peer,
            },
        };
        this.onMessage(message);
    }

    connect() {
        this._windowHere.addEventListener('message', this._listener);
        this.isConnected = true;
    }

    disconnect() {
        if (!this.isConnected) return;
        this._windowHere.removeEventListener('message', this._listener);
        this.isConnected = false;
    }
}
