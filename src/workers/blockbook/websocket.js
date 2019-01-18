/* @flow */

import WSWebSocket from 'ws';
import EventEmitter from 'events';
import Promise from 'es6-promise';
import WS from '../../utils/ws';

declare function wscallback(result: {}): void

export default class Socket extends EventEmitter {
    _url: string;
    _ws: ?WSWebSocket = null;
    _state: number = 0;

    _messageID: number = 0;
    _pendingMessages: { [string]: wscallback } = {};
    _subscriptions: { [string]: wscallback } = {};

    _send(method: string, params: {}, callback: wscallback): string {
        const id = this._messageID.toString();
        this._messageID++;
        this._pendingMessages[id] = callback;
        const req = {
            id,
            method,
            params
        }
        this._ws.send(JSON.stringify(req));
        return id;
    }

    _subscribe(method: string, params: {}, callback: wscallback): string {
        const id = _messageID.toString();
        this._messageID++;
        this._subscriptions[id] = callback;
        const req = {
            id,
            method,
            params
        }
        this._ws.send(JSON.stringify(req));
        return id;
    }

    _unsubscribe(method: string, id: string, params: {}, callback: wscallback): string {
        delete this._subscriptions[id];
        this._pendingMessages[id] = callback;
        var req = {
            id,
            method,
            params
        }
        this._ws.send(JSON.stringify(req));
        return id;
    }

    _onmessage(m: string) {
        console.log('resp ' + m);
        const resp = JSON.parse(m);
        const f = this._pendingMessages[resp.id];
        if (f != undefined) {
            delete this._pendingMessages[resp.id];
            f(resp.data);
        } else {
            const s = this._subscriptions[resp.id];
            if (s != undefined) {
                s(resp.data);
            }
            else {
                console.log("unkown response " + resp.id);
            }
        }
    }

    _createWebSocket(): WSWebSocket {
        const websocket = new WSWebSocket(this._url);
        // we will have a listener for each outstanding request,
        // so we have to raise the limit (the default is 10)
        if (typeof websocket.setMaxListeners === 'function') {
            websocket.setMaxListeners(Infinity)
        }
        return websocket;
    }

    _onOpenError(err: Error) {
        console.error("OpenError", err)
    }

    constructor(url: string) {
        super();
        this.setMaxListeners(Infinity);
        if (url.startsWith("http")) {
            url = url.replace("http", "ws");
        }
        if (!url.endsWith("/websocket")) {
            url += "/websocket";
        }
        this._url = url;
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
                ws.once('error', this._onOpenError.bind(this));
                ws.on('message', this._onmessage.bind(this));

                // this._onUnexpectedCloseBound = this._onUnexpectedClose.bind(this, true, resolve, reject)
                //this._ws.once('close', this._onUnexpectedCloseBound)
                ws.on('open', resolve);
                ws.on('close', () => {
                    this.emit('disconnected');
                });
                this._ws = ws;
                this._messageID = 0;
                this._pendingMessages = {};
                this._subscriptions = {};
            }
        });
    }

    disconnect() {
        return new Promise(() => {
            this._ws.close();
            // this._socket.emit('subscribe', 'bitcoind/hashblock', resolve);
        });
    }

    isConnected(): boolean {
        return this._ws && this._ws.readyState == WS.OPEN;
    }

    getServerInfo() {
        return new Promise((resolve) => {
            this._send('getInfo', {}, response => {
                resolve({
                    block: response.bestheight,
                    // network: response.result.network,
                    networkName: response.name,
                });
            });
        });
    }

}