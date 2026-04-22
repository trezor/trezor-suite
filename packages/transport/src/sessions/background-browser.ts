import * as ERRORS from '../errors';
import type { Descriptor } from '../types';
import { type SessionsBackground } from './background';
import {
    type HandleMessageParams,
    type HandleMessageResponse,
    type SessionsBackgroundInterface,
} from './types';

const REQUEST_TIMEOUT_MS = 10_000;

/**
 * creating BrowserSessionsBackground initiates sessions-background for browser based environments and provides:
 * - `handleMessage` which is used to send messages to sessions background
 * - `on` which is used to accept information about descriptors change from
 *    another tab and notify local transport
 * if possible sessions background utilizes native Sharedworker. If for whatever reason
 * Sharedworker is not available, the constructor throws an error.
 */
export class BrowserSessionsBackground implements SessionsBackgroundInterface {
    private readonly background;

    constructor(sessionsBackgroundUrl: string) {
        this.background = new SharedWorker(sessionsBackgroundUrl, {
            name: '@trezor/connect-web transport sessions worker',
        });
    }

    handleMessage<M extends HandleMessageParams>(params: M): Promise<HandleMessageResponse<M>> {
        const { background } = this;

        return new Promise<HandleMessageResponse<M>>(resolve => {
            let settled = false;
            const cleanup: Array<() => void> = [];

            const timeoutResponse = {
                success: false,
                error: { code: ERRORS.SESSION_BACKGROUND_TIMEOUT },
                id: params.id ?? -1,
            } as HandleMessageResponse<M>;

            const settle = (value: HandleMessageResponse<M>) => {
                if (settled) return;
                settled = true;
                cleanup.forEach(fn => fn());
                resolve(value);
            };

            const onmessage = (message: MessageEvent<any>) => {
                if (params.id === message.data.id) {
                    settle(message.data);
                }
            };

            const onmessageerror = (message: MessageEvent<any>) => {
                console.error('background-browser onmessageerror,', message);
                settle(timeoutResponse);
            };

            background.port.addEventListener('message', onmessage);
            background.port.addEventListener('messageerror', onmessageerror);
            cleanup.push(() => background.port.removeEventListener('message', onmessage));
            cleanup.push(() => background.port.removeEventListener('messageerror', onmessageerror));

            const timeoutHandle = setTimeout(() => settle(timeoutResponse), REQUEST_TIMEOUT_MS);
            cleanup.push(() => clearTimeout(timeoutHandle));

            background.port.postMessage(params);
        });
    }

    on(event: 'descriptors', listener: (descriptors: Descriptor[]) => void): void;
    on(event: 'releaseRequest', listener: (descriptor: Descriptor) => void): void;
    on(event: 'descriptors' | 'releaseRequest', listener: (descriptors: any) => void): void {
        this.background.port.addEventListener(
            'message',
            (
                e: MessageEvent<
                    //  either standard response from sessions background (we ignore this one)
                    | Awaited<ReturnType<SessionsBackground['handleMessage']>>
                    // or artificially broadcasted message to all clients (see background-sharedworker)
                    | { type: 'descriptors'; payload: Descriptor[] }
                >,
            ) => {
                if (e && 'type' in e.data) {
                    if (e.data.type === event) {
                        listener(e.data.payload);
                    }
                }
            },
        );
    }

    dispose() {
        /* is it needed? */
    }
}
