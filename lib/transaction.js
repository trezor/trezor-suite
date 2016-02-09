/* @flow
 * Transaction utilities and data structures
 */

import { Transaction } from 'bitcoinjs-lib';
import type { Output } from 'bitcoinjs-lib';

type TransactionInfoData = {
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
    }

    static fromJSON(data: TransactionInfoData) {
        return new TransactionInfo(
            Transaction.fromHex(data.tx),
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

export class TransactionMap {
    infos: Map<string, TransactionInfo>;

    constructor(infos: Map<string, TransactionInfo> = new Map) {
        this.infos = infos;
    }

    asArray(): Array<TransactionInfo> {
        return Array.from(this.infos.values());
    }

    get(id: string): ?TransactionInfo {
        return this.infos.get(id);
    }

    getOutput(id: string, i: number): ?Output {
        let info = this.infos.get(id);
        if (info != null) {
            return info.tx.outs[i];
        }
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
