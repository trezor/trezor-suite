import {EventEmitter} from 'events';
import {Transaction} from 'bitcoinjs-lib';
import socketIO from 'socket.io-client';

import {TxInfo} from './transaction';

export class TxResult {
    constructor(info, addresses) {
        this.info = info;
        this.addresses = addresses;
    }
}

export class Blockchain extends EventEmitter {

    constructor(endpoint) {
        super();
        this.txs = {};
        this.socket = socketIO(endpoint);
        this.socket.on('address/transaction', (r) => {
            this.emit('transaction', this.toTxResult(r));
        });
    }

    subscribe(addresses) {
        this.socket.emit('subscribe', 'address/transaction', addresses);
    }

    lookupTxs(addresses, start = null, end = null) {
        return lookupAddressHistories(this.socket, addresses, start, end)
            .then((result) => result.items.map((r) => this.toTxResult(r)));
    }

    lookupTx(hash) {
        return lookupTx(this.socket, hash)
            .then((r) => this.toTxInfo(r));
    }

    sendTx(hex) {
        // TODO
    }

    lookupBlockIndex(hash) {
        return lookupBlockIndex(this.socket, hash);
    }

    lookupBestBlockHash() {
        return lookupBestBlockHash(this.socket);
    }

    toTxResult(r) {
        let info = this.toTxInfo(r);
        let addresses = (r.address) ? [r.address] : Object.keys(r.addresses);
        return new TxResult(info, addresses);
    }

    toTxInfo(r) {
        let id = r.tx.hash;
        let tx;
        if (this.txs[id]) {
            tx = this.txs[id];
        } else {
            tx = bitcoreToTx(r.tx);
            this.txs[id] = tx;
        }
        return new TxInfo(tx, id, r.height);
    }
}

function bitcoreToTx(r) {
    let tx = new Transaction;

    tx.version = r.version;
    tx.locktime = r.nLockTime;

    tx.ins = r.inputs.map((ir) => {
        let script = new Buffer(ir.script, 'hex');
        let hash = new Buffer(ir.prevTxId, 'hex');

        Array.prototype.reverse.call(hash);

        return {
            script,
            hash,
            index: ir.outputIndex >>> 0,
            sequence: ir.sequenceNumber >>> 0
        };
    });

    tx.outs = r.outputs.map((or, index) => {
        let script = new Buffer(or.script, 'hex');

        return {
            script,
            index,
            value: or.satoshis
        };
    });

    return tx;
}

function lookupAddressHistories(socket, addresses, start, end) {
    let method = 'getAddressHistory';
    let params = [
        addresses,
        {
            start,
            end,
            queryMempool: true
        }
    ];
    return send(socket, { method, params });
}

function lookupTx(socket, hash) {
    let method = 'getTransaction';
    let params = [
        hash,
        true // queryMempool
    ];
    return send(socket, { method, params });
}

function lookupBlockIndex(socket, hash) {
    let method = 'getBlockIndex';
    let params = [
        hash
    ];
    return send(socket, { method, params });
}

function lookupBestBlockHash(socket) {
    let method = 'getBestBlockHash';
    let params = [];
    return send(socket, { method, params });
}

function send(socket, message) {
    return new Promise((resolve, reject) => {
        socket.send(message, ({error, result}) => {
            if (error) {
                reject(new Error(error));
            } else {
                resolve(result);
            }
        });
    });
}
