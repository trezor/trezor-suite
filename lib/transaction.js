/* @flow
 * Transaction utilities and data structures
 */

import { Transaction, address as baddress } from 'bitcoinjs-lib';
import type { Output } from 'bitcoinjs-lib';

export type TransactionInfoData = {
    tx: string;
    id: string;
    height: ?number;
    timestamp: ?number;
};

export class TransactionInfo {
    tx: Transaction;
    id: string;
    height: ?number;
    timestamp: ?number;

    inputIds: Array<string>;
    outputAddresses: Array<?string>;

    constructor(
        tx: Transaction,
        id: string,
        height: ?number,
        timestamp: ?number
    ) {
        this.tx = tx;
        this.id = id;
        this.height = height;
        this.timestamp = timestamp;

        let inputIds = [];
        tx.ins.forEach((input) => {
            let hash = input.hash;
            Array.prototype.reverse.call(hash);
            inputIds.push(hash.toString('hex'));
            Array.prototype.reverse.call(hash);
        });
        this.inputIds = inputIds;

        let outputAddresses = [];
        tx.outs.forEach((output) => {
            let address;
            try {
                address = baddress.fromOutputScript(output.script);
            } catch (e) {
                console.warn('Error while parsing output script', e);
                address = null;
            }
            outputAddresses.push(address);
        });
        this.outputAddresses = outputAddresses;
    }

    static fromJSON(data: TransactionInfoData): TransactionInfo {
        let tx = Transaction.fromHex(data.tx);

        return new TransactionInfo(
            tx,
            data.id,
            data.height,
            data.timestamp
        );
    }

    toJSON(): TransactionInfoData {
        return {
            tx: this.tx.toHex(),
            id: this.id,
            height: this.height,
            timestamp: this.timestamp,
        };
    }
}

type Collection<T> = Array<T> | Set<T> | Map<any, T>;

export type TransactionMapData = Array<TransactionInfoData>;

export class TransactionMap {
    infos: Map<string, TransactionInfo>;

    constructor(infos: Map<string, TransactionInfo> = new Map()) {
        this.infos = infos;
    }

    ids(): Array<string> {
        return Array.from(this.infos.keys());
    }

    asArray(): Array<TransactionInfo> {
        return Array.from(this.infos.values());
    }

    get(id: string): ?TransactionInfo {
        return this.infos.get(id);
    }

    set(id: string, info: TransactionInfo) {
        this.infos.set(id, info);
    }

    getOutput(id: string, i: number): ?Output {
        let info = this.infos.get(id);
        if (info != null) {
            return info.tx.outs[i];
        }
    }

    map<T>(fn: (info: TransactionInfo, id: string) => T): Array<T> {
        let results = [];
        this.infos.forEach((info, id) => {
            results.push(fn(info, id));
        });
        return results;
    }

    extend(infos: Collection<TransactionInfo>): TransactionMap {
        let copy = new Map(this.infos);
        infos.forEach((info) => {
            copy.set(info.id, info);
        });
        return new TransactionMap(copy);
    }

    merge(map: TransactionMap): TransactionMap {
        return this.extend(map.infos);
    }
}
