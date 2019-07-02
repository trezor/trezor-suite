/**
 * Provides `EventEmitter` interface for native browser `WebSocket`,
 * same, as `ws` package provides.
 */

const events = require('events'); // eslint-disable-line @typescript-eslint/no-var-requires

class WSWrapper extends events.EventEmitter {
    ws;
    constructor(url) {
        super();
        this.setMaxListeners(Infinity);
        this.ws = new WebSocket(url);
        this.ws.onclose = () => {
            this.emit('close');
        };
        this.ws.onopen = () => {
            this.emit('open');
        };
        this.ws.onerror = error => {
            this.emit('error', error);
        };
        this.ws.onmessage = message => {
            this.emit('message', message.data);
        };
    }

    close() {
        if (this.readyState === 1) {
            this.ws.close();
        }
    }

    send(message) {
        this.ws.send(message);
    }

    get readyState() {
        return this.ws.readyState;
    }
}
WSWrapper.CONNECTING = 0;
WSWrapper.OPEN = 1;
WSWrapper.CLOSING = 2;
WSWrapper.CLOSED = 3;
module.exports = WSWrapper;
