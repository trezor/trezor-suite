/* @flow */
import EventEmitter from 'events';
import socketIO from 'socket.io-client';
import Promise from 'es6-promise';

import type { Socket } from 'socket.io-client';

class Connection extends EventEmitter {
    _url: string;
    _socket: Socket;

    constructor(url: string) {
        super();
        this._url = url
    }

    connect() {
        return new Promise((resolve, reject) => {
            const socket = socketIO(this._url, {
                transports: ['websocket'],
                reconnection: false,
            });

            socket.on('connect', () => {
                socket.removeAllListeners('connect_error');
                socket.removeAllListeners('connect_timeout');
                socket.on('disconnect', () => {
                    this.emit('disconnected');
                })
                resolve();
            });
            socket.on('connect_timeout', reject);
            socket.on('connect_error', reject);
            this._socket = socket;
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
            }, response => {
                resolve({
                    block: response.result.blocks,
                    network: response.result.network,
                    networkName: response.result.coin_name,
                });
            });
        });
    }

    getAccountInfo(descriptor: string) {
        return new Promise((resolve) => {
            this._socket.send({
                method: 'getAccountInfo',
                params: {
                    descriptor,
                    details: 'txs', // 'basic', // 'balance', 'txs'
                    page: 0,
                    pageSize: 40,
                },
            }, response => {
                console.log("ACC", response)
                const nonce = parseInt(response.nonce, 10);
                resolve({
                    balance: response.balanceSat,
                    // availableBalance: response.unconfirmedBalanceSat,
                    availableBalance: response.balanceSat,
                    fresh: !(response.txApperances > 0),
                    sequence: isNaN(nonce) ? 0 : nonce,
                    erc20tokens: response.erc20tokens,
                });
            });
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

    subscribeBlock() {
        return new Promise((resolve) => {
            this._socket.on('bitcoind/hashblock', (result) => {
                console.warn("BLOCK!", result)
                this.emit('block', {
                    block: 0,
                    hash: result,
                })
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

    subscribeAddresses(addresses: Array<string>) {
        return new Promise((resolve) => {
            this._socket.on('bitcoind/addresstxid', (result) => {
                this._socket.send({
                    method: 'getDetailedTransaction',
                    params: [
                        result.txid
                    ]
                }, detail => {
                    this.emit('notification', detail.result)
                });
            });
            this._socket.emit('subscribe', 'bitcoind/addresstxid', addresses, resolve);
        });
    }

    disconnect() {
        return new Promise(() => {
            this._socket.disconnect();
            // this._socket.emit('subscribe', 'bitcoind/hashblock', resolve);
        });
    }

}

export default Connection;