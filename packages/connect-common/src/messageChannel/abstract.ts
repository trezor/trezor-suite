/**
 * IMPORTS WARNING
 * this file is bundled into content script so be careful what you are importing not to bloat the bundle
 */

import { Deferred, createDeferred } from '@trezor/utils/lib/createDeferred';
import { TypedEmitter } from '@trezor/utils/lib/typedEventEmitter';

// todo: I can't import Log from connect to connect-common (connect imports from connect-common).
// so logger should be probably moved to connect common, or this file should be moved to connect
// import type { Log } from '@trezor/connect/lib/utils/debug';
type Log = any;

export interface AbstractMessageChannelConstructorParams {
    sendFn: (message: any) => void;
    channel: {
        here: string;
        peer: string[];
    };
    logger?: Log;
}

export type Message<IncomingMessages extends { type: string }> = {
    channel: AbstractMessageChannelConstructorParams['channel'];
    id: number;
    type: IncomingMessages['type'];
    payload: IncomingMessages;
    success: boolean;
};

/**
 * concepts:
 * - it handshakes automatically with the other side of the channel
 * - it queues messages fired before handshake and sends them after handshake is done
 */
export abstract class AbstractMessageChannel<
    IncomingMessages extends { type: string },
> extends TypedEmitter<{
    message: Message<IncomingMessages>;
}> {
    protected messagePromises: Record<number, Deferred<any>> = {};
    /** queue of messages that were scheduled before handshake */
    protected messagesQueue: any[] = [];
    protected messageID = 0;

    abstract disconnect(): void;

    private handshakeCurrentRetry = 0;
    private handshakeMaxRetries = 5;
    private handshakeRetryInterval = 2000;
    private handshakeFinished: Deferred<void> | undefined;

    protected logger?: Log;

    /**
     * function that passes data to the other side of the channel
     */
    sendFn: AbstractMessageChannelConstructorParams['sendFn'];
    /**
     * channel identifiers that pairs AbstractMessageChannel instances on sending and receiving end together
     */
    channel: AbstractMessageChannelConstructorParams['channel'];

    constructor({ sendFn, channel, logger }: AbstractMessageChannelConstructorParams) {
        super();
        this.channel = channel;
        this.sendFn = (message: any) => {
            try {
                message.channel = this.channel;
                sendFn(message);
            } catch (err) {
                this.messagesQueue.push(message);
            }
        };
        this.logger = logger;
    }

    /**
     * initiates handshake sequence with peer. resolves after communication with peer is established
     */
    public async init() {
        console.log('init in connect-common/src/messageChannel/abstract.ts');
        if (this.handshakeFinished?.promise) {
            await this.handshakeFinished.promise;
        } else {
            await this.handshakeWithPeer();
        }
    }

    /**
     * handshake between both parties of the channel.
     * both parties initiate handshake procedure and keep asking over time in a loop until they time out or receive confirmation from peer
     */
    protected handshakeWithPeer(): Promise<void> {
        console.log('handshakeWithPeer in connect-common/src/messageChannel/abstract.ts');
        this.logger?.log(this.channel.here, 'handshake, retry: ', this.handshakeCurrentRetry);
        this.handshakeFinished = createDeferred();

        this.sendFn({
            type: 'channel-handshake-request',
            channel: this.channel,
            data: { success: true, payload: undefined },
        });

        return Promise.race([
            this.handshakeFinished.promise,
            new Promise((_resolve, reject) => {
                setTimeout(() => {
                    reject(new Error('handshake timeout'));
                }, this.handshakeRetryInterval);
            }),
        ])
            .then(() => {
                this.logger?.log(this.channel.here, 'handshake confirmed');
                this.messagesQueue.forEach(message => this.sendFn(message));
                this.messagesQueue = [];

                this.handshakeFinished!.resolve();
            })
            .catch(() => {
                this.handshakeCurrentRetry++;
                if (this.handshakeCurrentRetry < this.handshakeMaxRetries) {
                    return this.handshakeWithPeer();
                }
                throw new Error('handshake failed');
            });
    }

    /**
     * message received from communication channel in descendants of this class
     * should be handled by this common onMessage method
     */
    protected onMessage(message: Message<IncomingMessages>) {
        console.log('onMessage in connect-common/src/messageChannel/abstract.ts');
        console.log('message', message);
        const { channel, id, type, payload, success } = message;

        if (!channel?.peer || !channel.peer.includes(this.channel.here)) {
            return;
        }
        if (!channel?.here || !this.channel.peer.includes(channel.here)) {
            return;
        }

        if (type === 'channel-handshake-request') {
            console.log(
                'channel handshake request in connect-common/src/messageChannel/abstract.ts',
            );
            console.log('now we are going to send channel-handshake-confirm');
            this.sendFn({
                type: 'channel-handshake-confirm',
                channel: this.channel,
                data: { success: true, payload: undefined },
            });
            return;
        }
        if (type === 'channel-handshake-confirm') {
            this.handshakeFinished?.resolve(undefined);
            return;
        }

        if (this.messagePromises[id]) {
            this.messagePromises[id].resolve({ id, payload, success });
            delete this.messagePromises[id];
        }
        const messagePromisesLength = Object.keys(this.messagePromises).length;
        if (messagePromisesLength > 5) {
            this.logger.warn(
                `too many message promises (${messagePromisesLength}). this feels unexpected!`,
            );
        }

        this.emit('message', message);
    }

    // todo: outgoing messages should be typed
    postMessage(message: any, usePromise = true) {
        if (!usePromise) {
            this.sendFn(message);
            return;
        }

        this.messageID++;
        message.id = this.messageID;
        this.messagePromises[message.id] = createDeferred();

        this.sendFn(message);

        return this.messagePromises[message.id].promise;
    }
}
