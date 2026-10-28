import {
    type Descriptor,
    type HandleMessageParams,
    type HandleMessageResponse,
    type SessionsBackground,
    type SessionsBackgroundInterface,
    TRANSPORT_ERROR,
    error,
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
    // in-flight handleMessage requests: port listener -> callback settling its promise
    private readonly pendingRequests = new Map<(e: MessageEvent<any>) => void, () => void>();
    private readonly portListeners: Array<(e: MessageEvent<any>) => void> = [];
    // event -> caller listener -> its port wrappers. One entry per registration, so that
    // registering the same listener twice needs two off() calls, same as EventEmitter.
    private readonly listenerMap = new Map<
        string,
        Map<(...args: any[]) => void, Array<(e: MessageEvent<any>) => void>>
    >();

    constructor(sessionsBackgroundUrl: string) {
        this.background = new SharedWorker(sessionsBackgroundUrl, {
            name: '@trezor/connect-web transport sessions worker',
        });
        // When using MessagePort with addEventListener(), start() may be required
        // to begin dispatching messages. Native implementations often do this implicitly.
        // For polyfilled SharedWorker, we need to call it explicitly.
        this.background.port.start();
        // onmessageerror is a single assignable property, so it is registered once here and settles
        // all in-flight requests. Registering it per request detached only the most recent one.
        this.background.port.onmessageerror = message => {
            // not sure under what circumstances this error occurs. let's observe it during testing
            console.error('background-browser onmessageerror,', message);

            this.settlePendingRequests();
        };
    }

    handleMessage<M extends HandleMessageParams>(params: M): Promise<HandleMessageResponse<M>> {
        const { background } = this;

        return new Promise(resolve => {
            const onmessage = (message: MessageEvent<any>) => {
                if (params.id === message.data.id) {
                    resolve(message.data);
                    this.removePortListener(onmessage);
                    this.pendingRequests.delete(onmessage);
                }
            };
            // called when the response can not be delivered anymore, because the listener above is
            // being detached. Resolving with an error keeps the contract of
            // SessionsBackground.handleMessage, which never leaves a client in a "hanged" state.
            const abandon = () => {
                this.removePortListener(onmessage);
                resolve({
                    ...error({ code: TRANSPORT_ERROR.UNEXPECTED_ERROR }),
                    id: params.id,
                } as HandleMessageResponse<M>);
            };

            this.pendingRequests.set(onmessage, abandon);
            this.portListeners.push(onmessage);
            background.port.addEventListener('message', onmessage);

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
        const wrappedListeners = eventMap.get(listener) ?? [];
        wrappedListeners.push(wrappedListener);
        eventMap.set(listener, wrappedListeners);
        this.portListeners.push(wrappedListener);
        this.background.port.addEventListener('message', wrappedListener);
    }

    off(event: 'descriptors', listener: (descriptors: Descriptor[]) => void): void;
    off(event: 'releaseRequest', listener: (descriptor: Descriptor) => void): void;
    off(event: 'descriptors' | 'releaseRequest', listener: (...args: any[]) => void): void {
        const wrappedListeners = this.listenerMap.get(event)?.get(listener);
        const wrappedListener = wrappedListeners?.pop();
        if (wrappedListener) {
            this.removePortListener(wrappedListener);
            if (!wrappedListeners?.length) {
                this.listenerMap.get(event)!.delete(listener);
            }
        }
    }

    dispose() {
        // detaching the listeners below makes pending responses undeliverable, settle them first
        this.settlePendingRequests();
        for (const listener of this.portListeners) {
            this.background.port.removeEventListener('message', listener);
        }
        this.portListeners.length = 0;
        this.listenerMap.clear();
    }

    private removePortListener(listener: (e: MessageEvent<any>) => void) {
        this.background.port.removeEventListener('message', listener);
        const idx = this.portListeners.indexOf(listener);
        if (idx !== -1) this.portListeners.splice(idx, 1);
    }

    private settlePendingRequests() {
        const pending = [...this.pendingRequests.values()];
        this.pendingRequests.clear();
        pending.forEach(abandon => abandon());
    }
}
