import { CustomError } from '@trezor/blockchain-link-types/src/constants/errors';
import { WebsocketClient, WebsocketRequest, WebsocketResponse } from '@trezor/websocket-client';

interface Subscription<T> {
    id: string;
    type: T;
    callback: (result: any) => void;
}

export abstract class BaseWebsocket<T extends Record<string, any>> extends WebsocketClient<T> {
    private readonly subscriptions: Subscription<keyof T>[] = [];

    async onPing() {
        // make sure that connection is alive if there are subscriptions
        if (this.subscriptions.length > 0 || this.options.keepAlive) {
            await this.ping().catch(error => {
                throw new CustomError('websocket_runtime_error', error.message);
            });
        } else {
            this.disconnect();
        }
    }

    protected onMessage(message: WebsocketResponse) {
        super.onMessage(message, ({ id, data }) => {
            if (data.error) {
                throw new CustomError('websocket_error_message', data.error.message);
            }

            const messageSettled = this.messages.resolve(Number(id), data);
            if (!messageSettled) {
                const subs = this.subscriptions.find(s => s.id === id);
                if (subs) {
                    subs.callback(data);
                }
            }
        });
    }

    sendMessage(message: WebsocketRequest) {
        return super.sendMessage(message).catch(error => {
            throw new CustomError(error.message);
        });
    }

    protected addSubscription<E extends keyof T>(type: E, callback: (result: T[E]) => void) {
        const id = this.messages.nextId().toString();
        this.subscriptions.push({ id, type, callback });
    }

    protected removeSubscription(type: keyof T) {
        const index = this.subscriptions.findIndex(s => s.type === type);
        if (index >= 0) {
            // remove previous subscriptions
            this.subscriptions.splice(index, 1);
        }

        return index;
    }
}
