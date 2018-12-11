/* @flow */

import WSWebSocket from 'ws';
import EventEmitter from 'events';
import Promise from 'es6-promise';


export default class Socket extends EventEmitter {
    _url: string;
    _ws: ?WSWebSocket = null;
    _state: number = 0;

    constructor(url: string) {
        super();
        this.setMaxListeners(Infinity);
        // this._url = url
        // this._url = 'wss://blockbook-dev.corp.sldev.cz:19136/socket.io/?EIO=3&transport=websocket';
        this._url = 'wss://blockbook-dev.corp.sldev.cz:19136/websocket';
    }

    _createWebSocket(): WSWebSocket {
        console.warn("WS", WSWebSocket)
        const websocket = new WSWebSocket(this._url);
        // we will have a listener for each outstanding request,
        // so we have to raise the limit (the default is 10)
        if (typeof websocket.setMaxListeners === 'function') {
            websocket.setMaxListeners(Infinity)
        }
        return websocket;
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
                const ws = this._createWebSocket();
                // this._onOpenErrorBound = this._onOpenError.bind(this, reject);
                ws.once('error', this._onOpenErrorBound);
                ws.on('message', (m) => {
                    console.warn("WS on message!", m);
                });

                // this._onUnexpectedCloseBound = this._onUnexpectedClose.bind(this, true, resolve, reject)
                //this._ws.once('close', this._onUnexpectedCloseBound)
                ws.on('open', resolve);
                this._ws = ws;
            }
        });
    }

    _onOpenErrorBound(err: Error) {
        console.warn("ERR", err)
    }
}