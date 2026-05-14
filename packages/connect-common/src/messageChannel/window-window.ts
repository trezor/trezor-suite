import {
    AbstractMessageChannel,
    type AbstractMessageChannelConstructorParams,
    type Message,
} from './abstract';

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
    _origin: string;

    constructor({
        windowHere,
        windowPeer,
        channel,
        logger,
        origin,
    }: Pick<AbstractMessageChannelConstructorParams, 'channel' | 'logger'> & {
        windowHere: Window;
        // specific peer can change over time, for example when different popup is opened
        // therefore it's a function that returns the current peer
        windowPeer: () => Window | undefined;
        origin: string;
    }) {
        super({
            channel,
            sendFn: (message: any) => {
                windowPeer()?.postMessage(message, origin);
            },
            logger,
        });

        this._listener = this.listener.bind(this);
        this._windowHere = windowHere;
        this._origin = origin;
        this.connect();
    }

    listener(event: MessageEvent<Message<IncomingMessages>>) {
        // Only accept messages from the expected peer origin. Without this check
        // any window with a reference to `windowHere` (e.g. an opener or embedder)
        // could inject messages with spoofed `channel` metadata, since
        // `AbstractMessageChannel.onMessage` only validates the channel name strings,
        // which are well-known constants. Reject the special "null" origin
        // (sandboxed iframes / file://) outright.
        if (event.origin !== this._origin || event.origin === 'null') {
            this.logger?.warn(
                `WindowWindowChannel: ignoring message from unexpected origin "${event.origin}", expected "${this._origin}"`,
            );

            return;
        }

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
