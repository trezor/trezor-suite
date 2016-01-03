/* @flow
 * Interface to bitcore-node blockchain backend
 */

import {EventEmitter} from 'events';
import {Transaction, address as baddress } from 'bitcoinjs-lib';
import socketIO from 'socket.io-client';

import {TxInfo} from './transaction';

type BcInput = {
    script: string;
    prevTxId: string;
    outputIndex: number;
    sequenceNumber: number;
};
type BcOutput = {
    script: string;
    satoshis: number;
};
type BcTx = {
    hash: string,
    version: number;
    nLockTime: number;
    inputs: Array<BcInput>;
    outputs: Array<BcOutput>;
};
type BcBlockIndex = { height: number; };
type BcTxInfo = { tx: BcTx; height: ?number; timestamp: number; };
type BcHistory = { addresses: { [address: string]: Object; }; } & BcTxInfo;
type BcHistories = { items: Array<BcHistory> };
type BcNotification = { address: string; } & BcTxInfo;

export class TxResult {
    info: TxInfo;
    addresses: Array<string>;

    constructor(info: TxInfo, addresses: Array<string>) {
        this.info = info;
        this.addresses = addresses;
    }
}

export class Blockchain extends EventEmitter {
    txs: Map<string, Transaction>;
    socket: socketIO;

    constructor(endpoint: string) {
        super();
        this.txs = new Map;
        this.socket = socketIO(endpoint);
        this.socket.on('address/transaction', (r) => {
            this.emit('transaction', this.txResultFromNotification(r));
        });
    }

    subscribe(addresses: Array<string>) {
        this.socket.emit('subscribe', 'address/transaction', addresses);
    }

    lookupTxs(
        addresses: Array<string>,
        start: ?number = null,
        end: ?number = null
    ): Promise<Array<TxResult>> {
        return lookupAddressHistories(this.socket, addresses, start, end)
            .then((result) => result.items
                .map((r) => this.txResultFromHistory(r)));
    }

    lookupTx(hash: string): Promise<TxInfo> {
        return lookupTx(this.socket, hash)
            .then((r) => this.toTxInfo(r));
    }

    lookupBlockIndex(hash: string): Promise<BcBlockIndex> {
        return lookupBlockIndex(this.socket, hash);
    }

    lookupBestBlockHash(): Promise<string> {
        return lookupBestBlockHash(this.socket);
    }

    txResultFromNotification(r: BcNotification): TxResult {
        let addresses = [r.address];
        return new TxResult(this.toTxInfo(r), addresses);
    }

    txResultFromHistory(r: BcHistory): TxResult {
        let addresses = Object.keys(r.addresses);
        return new TxResult(this.toTxInfo(r), addresses);
    }

    toTxInfo(r: BcTxInfo): TxInfo {
        let height = r.height;
        let id = r.tx.hash;

        let tx;
        if (this.txs.has(id)) {
            tx = this.txs.get(id);
        } else {
            tx = bitcoreToTx(r.tx);
            this.txs.set(id, tx);
        }

        return new TxInfo(tx, id, r.height, r.timestamp);
    }
}

function bitcoreToTx(r: BcTx): Transaction {
    let tx = new Transaction;

    tx.version = r.version;
    tx.locktime = r.nLockTime;

    tx.ins = r.inputs.map((ir): Input => {
        let script = new Buffer(ir.script, 'hex');
        let hash = new Buffer(ir.prevTxId, 'hex');
        let id = ir.prevTxId;

        Array.prototype.reverse.call(hash);

        return {
            script,
            hash,
            id,
            index: ir.outputIndex >>> 0,
            sequence: ir.sequenceNumber >>> 0
        };
    });

    tx.outs = r.outputs.map((or): Output => {
        let script = new Buffer(or.script, 'hex');

        // TODO: pull the address out of BcHistory or BcNotification
        let address = baddress.fromOutputScript(script);

        return {
            address,
            script,
            value: or.satoshis
        };
    });

    return tx;
}

function lookupAddressHistories(
    socket: socketIO,
    addresses: Array<string>,
    start: ?number,
    end: ?number
): Promise<BcHistories> {
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

function lookupTx(socket: socketIO, hash: string): Promise<BcTxInfo> {
    let method = 'getTransaction';
    let params = [
        hash,
        true // queryMempool
    ];
    return send(socket, { method, params });
}

function lookupBlockIndex(socket: socketIO, hash: string): Promise<BcBlockIndex> {
    let method = 'getBlockIndex';
    let params = [
        hash
    ];
    return send(socket, { method, params });
}

function lookupBestBlockHash(socket: socketIO): Promise<string> {
    let method = 'getBestBlockHash';
    let params = [];
    return send(socket, { method, params });
}

function send<A, B>(socket: socketIO, message: A): Promise<B> {
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
