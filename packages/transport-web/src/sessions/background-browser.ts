import {
    type Descriptor,
    type HandleMessageParams,
    type HandleMessageResponse,
    type SessionsBackground,
    type SessionsBackgroundInterface,
} from '@trezor/transport-common';

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
    private readonly portListeners: Array<(e: MessageEvent<any>) => void> = [];
    private readonly listenerMap = new Map<
        string,
        Map<(...args: any[]) => void, (e: MessageEvent<any>) => void>
    >();

    constructor(sessionsBackgroundUrl: string) {
        this.background = new SharedWorker(sessionsBackgroundUrl, {
            name: '@trezor/connect-web transport sessions worker',
        });
        // When using MessagePort with addEventListener(), start() may be required
        // to begin dispatching messages. Native implementations often do this implicitly.
        // For polyfilled SharedWorker, we need to call it explicitly.
        this.background.port.start();
    }

    handleMessage<M extends HandleMessageParams>(params: M): Promise<HandleMessageResponse<M>> {
        const { background } = this;

        return new Promise(resolve => {
            const onmessage = (message: MessageEvent<any>) => {
                if (params.id === message.data.id) {
                    resolve(message.data);
                    background.port.removeEventListener('message', onmessage);
                    const idx = this.portListeners.indexOf(onmessage);
                    if (idx !== -1) this.portListeners.splice(idx, 1);
                }
            };

            this.portListeners.push(onmessage);
            background.port.addEventListener('message', onmessage);

            background.port.onmessageerror = message => {
                // not sure under what circumstances this error occurs. let's observe it during testing
                console.error('background-browser onmessageerror,', message);

                background.port.removeEventListener('message', onmessage);
                const idx = this.portListeners.indexOf(onmessage);
                if (idx !== -1) this.portListeners.splice(idx, 1);
            };
            background.port.postMessage(params);
        });
    }

    on(event: 'descriptors', listener: (descriptors: Descriptor[]) => void): void;
    on(event: 'releaseRequest', listener: (descriptor: Descriptor) => void): void;
    on(event: 'descriptors' | 'releaseRequest', listener: (descriptors: any) => void): void {
        const wrappedListener = (
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
        };
        let eventMap = this.listenerMap.get(event);
        if (!eventMap) {
            eventMap = new Map();
            this.listenerMap.set(event, eventMap);
        }
        eventMap.set(listener, wrappedListener);
        this.portListeners.push(wrappedListener);
        this.background.port.addEventListener('message', wrappedListener);
    }

    off(event: 'descriptors', listener: (descriptors: Descriptor[]) => void): void;
    off(event: 'releaseRequest', listener: (descriptor: Descriptor) => void): void;
    off(event: 'descriptors' | 'releaseRequest', listener: (...args: any[]) => void): void {
        const wrappedListener = this.listenerMap.get(event)?.get(listener);
        if (wrappedListener) {
            this.background.port.removeEventListener('message', wrappedListener);
            const idx = this.portListeners.indexOf(wrappedListener);
            if (idx !== -1) this.portListeners.splice(idx, 1);
            this.listenerMap.get(event)!.delete(listener);
        }
    }

    dispose() {
        for (const listener of this.portListeners) {
            this.background.port.removeEventListener('message', listener);
        }
        this.portListeners.length = 0;
        this.listenerMap.clear();
    }
}
