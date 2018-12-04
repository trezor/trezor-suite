/* @flow */
// import WebSocket from 'ws';
import EventEmitter from 'events';
import Promise from 'es6-promise';

// https://github.com/ripple/ripple-lib/blob/develop/src/common/connection.ts

export interface ConnectionOptions {
    trace?: boolean,
    proxy?: string,
    proxyAuthorization?: string,
    authorization?: string,
    trustedCertificates?: string[],
    key?: string,
    passphrase?: string,
    certificate?: string,
    timeout?: number
  }

class Connection extends EventEmitter {
    _url: string;
    _ws: ?WebSocket = null;
    _state: number = 0;
    _isReady: boolean = false;

    // constructor(url: string, options: ConnectionOptions = {}) {
    constructor(url: string) {
        super();
        this.setMaxListeners(Infinity);
        this._url = url
    }

    isConnected() {
        return this._state === WebSocket.OPEN && this._isReady;
    }

    _createWebSocket(): WebSocket {
        console.warn("WS", WebSocket)
        const websocket = new WebSocket(this._url);
        // we will have a listener for each outstanding request,
        // so we have to raise the limit (the default is 10)
        if (typeof websocket.setMaxListeners === 'function') {
            websocket.setMaxListeners(Infinity)
        }
        return websocket;
    }

    _onOpen() {

    }

    connect() {
        //this._clearReconnectTimer()
        return new Promise((resolve, reject) => {
            if (!this._url) {
                reject(new Error('Cannot connect because no server was specified'));
            }
            if (this._state === WebSocket.OPEN) {
                resolve()
            } else if (this._ws && this._state === WebSocket.CONNECTING) {
                this._ws.once('open', resolve)
            } else {
                this._ws = this._createWebSocket();
                // this._onOpenErrorBound = this._onOpenError.bind(this, reject);
                //this._ws.once('error', this._onOpenErrorBound);
                this._ws.addEventListener('message', (m) => {
                    console.warn("WS on message!", m);
                });

                // this._onUnexpectedCloseBound = this._onUnexpectedClose.bind(this, true, resolve, reject)
                //this._ws.once('close', this._onUnexpectedCloseBound)
                this._ws.addEventListener('open', resolve);
            }
        });
    }

    getServerInfo() {
        return new Promise((resolve, reject) => {
            this._ws.send('getInfo');
        });
    }
}

export default Connection;