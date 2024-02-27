/**
 * IMPORTS WARNING
 * this file is bundled into content script so be careful what you are importing not to bloat the bundle
 */

import { Deferred, createDeferred } from '@trezor/utils';
import { TypedEmitter } from '@trezor/utils';
import { scheduleAction } from '@trezor/utils';

// TODO: so logger should be probably moved to connect common, or this file should be moved to connect
// import type { Log } from '@trezor/connect/lib/utils/debug';
type Log = {
    log: (...args: any[]) => void;
    error: (...args: any[]) => void;
    warn: (...args: any[]) => void;
    debug: (...args: any[]) => void;
};

export interface AbstractMessageChannelConstructorParams {
    sendFn: (message: any) => void;
    channel: {
        here: string;
        peer: string;
    };
    logger?: Log;
    lazyHandshake?: boolean;
    legacyMode?: boolean;
}

export type Message<IncomingMessages extends { type: string }> = IncomingMessages & {
    channel: AbstractMessageChannelConstructorParams['channel'];
    id: number;
    success: boolean;
    payload: Extract<IncomingMessages, { type: IncomingMessages['type'] }> | undefined;
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

    public isConnected = false;
    abstract connect(): void;
    abstract disconnect(): void;

    private readonly handshakeMaxRetries = 5;
    private readonly handshakeRetryInterval = 2000;
    private handshakeFinished: Deferred<void> | undefined;

    protected lazyHandshake?: boolean;
    protected legacyMode?: boolean;
    protected logger?: Log;

    /**
     * function that passes data to the other side of the channel
     */
    sendFn: AbstractMessageChannelConstructorParams['sendFn'];
    /**
     * channel identifiers that pairs AbstractMessageChannel instances on sending and receiving end together
     */
    channel: AbstractMessageChannelConstructorParams['channel'];

    constructor({
        sendFn,
        channel,
        logger,
        lazyHandshake = false,
        legacyMode = false,
    }: AbstractMessageChannelConstructorParams) {
        super();
        this.channel = channel;
        this.sendFn = sendFn;
        this.lazyHandshake = lazyHandshake;
        this.legacyMode = legacyMode;
        this.logger = logger;
    }

    /**
     * initiates handshake sequence with peer. resolves after communication with peer is established
     */
    public init() {
        if (!this.handshakeFinished) {
            this.handshakeFinished = createDeferred();
            if (this.legacyMode) {
                // Bypass handshake for communication with legacy components
                // We add a delay for enough time for the other side to be ready
                setTimeout(() => {
                    this.handshakeFinished?.resolve();
                }, 500);
            }
            if (!this.lazyHandshake) {
                // When `lazyHandshake` handshakeWithPeer will start when received channel-handshake-request.
                this.handshakeWithPeer();
            }
        }

        return this.handshakeFinished.promise;
    }

    /**
     * handshake between both parties of the channel.
     * both parties initiate handshake procedure and keep asking over time in a loop until they time out or receive confirmation from peer
     */
    protected handshakeWithPeer(): Promise<void> {
        this.logger?.log(this.channel.here, 'handshake');

        return scheduleAction(
            async () => {
                this.postMessage(
                    {
                        type: 'channel-handshake-request',
                        data: { success: true, payload: undefined },
                    },
                    { usePromise: false, useQueue: false },
                );
                await this.handshakeFinished?.promise;
            },
            {
                attempts: this.handshakeMaxRetries,
                timeout: this.handshakeRetryInterval,
            },
        )
            .then(() => {
                this.logger?.log(this.channel.here, 'handshake confirmed');
                this.messagesQueue.forEach(message => {
                    message.channel = this.channel;
                    this.sendFn(message);
                });
                this.messagesQueue = [];
            })
            .catch(() => {
                this.handshakeFinished?.reject(new Error('handshake failed'));
                this.handshakeFinished = undefined;
            });
    }

    /**
     * message received from communication channel in descendants of this class
     * should be handled by this common onMessage method
     */
    protected onMessage(_message: Message<IncomingMessages>) {
        // Older code used to send message as a data property of the message object.
        // This is a workaround to keep backward compatibility.
        let message = _message;
        if (
            this.legacyMode &&
            message.type === undefined &&
            'data' in message &&
            typeof message.data === 'object' &&
            message.data !== null &&
            'type' in message.data &&
            typeof message.data.type === 'string'
        ) {
            // @ts-expect-error
            message = message.data;
        }

        const { channel, id, type, payload, success } = message;

        // Don't verify channel in legacy mode
        if (!this.legacyMode) {
            if (!channel?.peer || channel.peer !== this.channel.here) {
                // To wrong peer
                return;
            }
            if (!channel?.here || this.channel.peer !== channel.here) {
                // From wrong peer
                return;
            }
        }

        if (type === 'channel-handshake-request') {
            this.postMessage(
                {
                    type: 'channel-handshake-confirm',
                    data: { success: true, payload: undefined },
                },
                { usePromise: false, useQueue: false },
            );
            if (this.lazyHandshake) {
                // When received channel-handshake-request in lazyHandshake mode we start from this side.
                this.handshakeWithPeer();
            }

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
            this.logger?.warn(
                `too many message promises (${messagePromisesLength}). this feels unexpected!`,
            );
        }

        // @ts-expect-error TS complains for odd reasons
        this.emit('message', message);
    }

    // todo: outgoing messages should be typed
    postMessage(message: any, { usePromise = true, useQueue = true } = {}) {
        message.channel = this.channel;
        if (!usePromise) {
            try {
                this.sendFn(message);
            } catch (err) {
                if (useQueue) {
                    this.messagesQueue.push(message);
                }
            }

            return;
        }

        this.messageID++;
        message.id = this.messageID;
        this.messagePromises[message.id] = createDeferred();

        try {
            this.sendFn(message);
        } catch (err) {
            if (useQueue) {
                this.messagesQueue.push(message);
            }
        }

        return this.messagePromises[message.id].promise;
    }

    resolveMessagePromises(resolvePayload: Record<string, any>) {
        // This is used when we know that the connection has been interrupted but there might be something waiting for it.
        Object.keys(this.messagePromises).forEach(id =>
            this.messagePromises[id as any].resolve({
                id,
                payload: resolvePayload,
            }),
        );
    }

    clear() {
        this.handshakeFinished = undefined;
    }
}
