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

        // React Native WebSocket is able to accept headers compared to the native browser `WebSocket`.
        // @ts-expect-error
        this._ws = new WebSocket(url, ['wss'], {
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

        // WebSocket error Event does not contain any useful description.
        // https://websockets.spec.whatwg.org//#dom-websocket-onerror
        // If the user agent was required to fail the WebSocket connection,
        // or if the WebSocket connection was closed after being flagged as full,
        // fire an event named error at the WebSocket object.
        // https://stackoverflow.com/a/31003057
        this._ws.onerror = _event => {
            this.emit('error', new Error(`WsWrapper error. Ready state: ${this.readyState}`));
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

export default WSWrapper;
