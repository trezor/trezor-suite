/**
 * IMPORTS WARNING
 * this file is bundled into content script so be careful what you are importing not to bloat the bundle
 */

import {
    type Deferred,
    TypedEmitter,
    createDeferred,
    createDeferredManager,
    scheduleAction,
} from '@trezor/utils';

import type { Log } from '../utils/debug';

export interface AbstractMessageChannelConstructorParams {
    sendFn: (message: any) => void;
    channel: {
        here: string;
        peer: string;
    };
    logger?: Log;
    lazyHandshake?: boolean;
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
    protected messages = createDeferredManager();
    /** queue of messages that were scheduled before handshake */
    protected messagesQueue: any[] = [];

    public isConnected = false;

    abstract connect(): void;

    abstract disconnect(): void;

    private readonly handshakeMaxRetries = 5;
    private readonly handshakeRetryInterval = 2000;
    private handshakeFinished: Deferred<void> | undefined;

    protected lazyHandshake?: boolean;
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
    }: AbstractMessageChannelConstructorParams) {
        super();
        this.channel = channel;
        this.sendFn = sendFn;
        this.lazyHandshake = lazyHandshake;
        this.logger = logger;
    }

    /**
     * initiates handshake sequence with peer. resolves after communication with peer is established
     */
    public init() {
        if (!this.handshakeFinished) {
            this.handshakeFinished = createDeferred();
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
        const message = _message;

        const { channel, id, type, ...data } = message;

        if (!channel?.peer || channel.peer !== this.channel.here) {
            // To wrong peer
            return;
        }
        if (!channel?.here || this.channel.peer !== channel.here) {
            // From wrong peer
            return;
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

        this.messages.resolve(id, { id, ...data });

        const messagePromisesLength = this.messages.length();
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
            } catch {
                if (useQueue) {
                    this.messagesQueue.push(message);
                }
            }

            return;
        }

        const { promise, promiseId } = this.messages.create();
        message.id = promiseId;

        try {
            this.sendFn(message);
        } catch {
            if (useQueue) {
                this.messagesQueue.push(message);
            }
        }

        return promise;
    }

    resolveMessagePromises(payload: Record<string, any>) {
        // This is used when we know that the connection has been interrupted but there might be something waiting for it.
        this.messages.resolveAll(id => ({ id, payload }));
    }

    /**
     * Clear any pending outgoing messages so that the next send is not
     * blocked behind queued work.  Override in subclasses that serialise
     * outgoing messages (e.g. via a send chain) to ensure urgent messages
     * such as cancel/close are delivered without delay.
     */
    clearPendingSends(): void {
        // No-op by default.
    }

    abortHandshake(reason?: string) {
        this.handshakeFinished?.reject(new Error(reason ?? 'Handshake aborted'));
        this.handshakeFinished = undefined;
    }

    clear() {
        this.handshakeFinished = undefined;
    }
}
