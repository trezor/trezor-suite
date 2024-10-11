import type { Descriptor } from '../types';
import { SessionsBackground } from './background';

import { HandleMessageParams, HandleMessageResponse, SessionsBackgroundInterface } from './types';

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

        return new Promise(resolve => {
            const onmessage = (message: MessageEvent<any>) => {
                if (params.id === message.data.id) {
                    resolve(message.data);
                    background.port.removeEventListener('message', onmessage);
                }
            };

            background.port.addEventListener('message', onmessage);

            background.port.onmessageerror = message => {
                // not sure under what circumstances this error occurs. let's observe it during testing
                console.error('background-browser onmessageerror,', message);

                background.port.removeEventListener('message', onmessage);
            };
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
                if ('type' in e?.data) {
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
