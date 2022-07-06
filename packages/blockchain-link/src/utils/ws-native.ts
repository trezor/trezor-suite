import { EventEmitter } from 'events';

/**
 * Provides `EventEmitter` interface for React Native `WebSocket`,
 * same, as `ws` package provides.
 */
class WSWrapper extends EventEmitter {
    private _ws: WebSocket;
    static CONNECTING = 0;
    static OPEN = 1;
    static CLOSING = 2;
    static CLOSED = 3;

    constructor(url: string, _protocols: any, _websocketOptions: any) {
        super();
        this.setMaxListeners(Infinity);

        // React Native WebSocket is able to accept headers compared to the native browser `WebSocket`.
        // @ts-ignore
        this._ws = new WebSocket(url, '', {
            headers: {
                'User-Agent': 'Trezor Suite Native',
            },
        });

        this._ws.onclose = () => {
            this.emit('close');
        };

        this._ws.onopen = () => {
            this.emit('open');
        };

        this._ws.onerror = error => {
            this.emit('error', error);
        };

        this._ws.onmessage = message => {
            this.emit('message', message.data);
        };
    }

    close() {
        if (this.readyState === 1) {
            this._ws.close();
        }
    }

    send(message: any) {
        this._ws.send(message);
    }

    get readyState() {
        return this._ws.readyState;
    }
}

export = WSWrapper;
