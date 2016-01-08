/* @flow
 * Transaction utilities and data structures
 */

import {Transaction} from 'bitcoinjs-lib';
import type {Output} from 'bitcoinjs-lib';

type TxInfoData = {
    tx: string;
    id: string;
    height: ?number;
    timestamp: number;
};

export class TxInfo {
    tx: Transaction;
    id: string;
    height: ?number;
    timestamp: number;

    constructor(
        tx: Transaction,
        id: string,
        height: ?number,
        timestamp: number
    ) {
        this.tx = tx;
        this.id = id;
        this.height = height;
        this.timestamp = timestamp;
    }

    static fromJSON(data: TxInfoData) {
        return new TxInfo(
            Transaction.fromHex(data.tx),
            data.id,
            data.height,
            data.timestamp
        );
    }

    toJSON(): TxInfoData {
        return {
            tx: this.tx.toHex(),
            id: this.id,
            height: this.height,
            timestamp: this.timestamp
        };
    }
}

type TxCollectionData = Array<TxInfo>;

export class TxCollection {
    infos: Map<string, TxInfo>;

    constructor() {
        this.infos = new Map;
    }

    store(): TxCollectionData {
        return this.asArray();
    }

    restore(data: TxCollectionData) {
        data.forEach((item) => {
            this.update(TxInfo.fromJSON(item));
        });
    }

    infoOf(id: string): ?TxInfo {
        return this.infos.get(id);
    }

    outputOf(id: string, i: number): ?Output {
        let info = this.infos.get(id);
        if (info) {
            return info.tx.outs[i];
        }
    }

    asArray(): Array<TxInfo> {
        return Array.from(this.infos.values());
    }

    update(info: TxInfo) {
        this.infos.set(info.id, info);
    }
}
