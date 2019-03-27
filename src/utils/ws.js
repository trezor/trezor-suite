/**
 * Copy/paste from /node_modules/ripple-lib/dist/npm/common/wswrapper.js
 * Provides `EventEmitter` interface for native browser `WebSocket`,
 * same, as `ws` package provides.
 */

const events = require('events');

class WSWrapper extends events.EventEmitter {
    constructor(url) {
        super();
        this.setMaxListeners(Infinity);
        this._ws = new WebSocket(url);
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

    send(message) {
        this._ws.send(message);
    }

    get readyState() {
        return this._ws.readyState;
    }
}
WSWrapper.CONNECTING = 0;
WSWrapper.OPEN = 1;
WSWrapper.CLOSING = 2;
WSWrapper.CLOSED = 3;
module.exports = WSWrapper;
