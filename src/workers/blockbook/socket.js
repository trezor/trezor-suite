/* @flow */
import socketIO from 'socket.io-client';
import Promise from 'es6-promise';

import type { Socket } from 'socket.io-client';

class Connection {
    _url: string;
    _socket: Socket;

    constructor(url: string) {
        this._url = url
    }

    connect() {
        return new Promise((resolve, reject) => {
            this._socket = socketIO(this._url, {
                transports: ['websocket'],
                reconnection: false,
            });

            this._socket.on('connect', resolve);
            this._socket.on('connect_error', reject);
        });
    }

    isConnected(): boolean {
        return this._socket && this._socket.connected;
    }

    getServerInfo() {
        return new Promise((resolve) => {
            this._socket.send({
                method: 'getInfo',
                params: []
            }, resolve);
        });
    }

    estimateSmartFee() {
        return new Promise((resolve) => {
            this._socket.send({
                method: 'estimateSmartFee',
                params: [2, false]
            }, resolve);
        });
    }

    subscribe() {
        return new Promise((resolve) => {
            this._socket.on('bitcoind/hashblock', (result) => {
                console.warn("BLOCK!", result)
            });
            this._socket.emit('subscribe', 'bitcoind/hashblock', resolve);
        });
        
        // return new Promise((resolve) => {
        //     this._socket.send({
        //         method: 'estimateSmartFee',
        //         params: [2, false]
        //     }, resolve);
        // });
    }

}

export default Connection;