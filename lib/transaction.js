import {Transaction} from 'bitcoinjs-lib';

export class TxInfo {

    static fromJSON(data) {
        let tx = Transaction.fromHex(data.tx);
        let id = tx.getId();
        return new TxInfo(tx, id, data.height);
    }

    constructor(tx, id, height) {
        this.tx = tx;
        this.id = id;
        this.height = height;
    }

    toJSON() {
        return {
            tx: this.tx.toHex(),
            height: this.height
        };
    }
}

export class TxDatabase {

    constructor() {
        this.infos = Object.create(null);   // tx id -> tx info
    }

    store() {
        let data = [];

        for (let index in this.infos) {
            let info = this.infos[index];
            let item = info.toJSON();
            data.push(item);
        }

        return data;
    }

    restore(data) {
        data.forEach((item) => {
            let info = TxInfo.fromJSON(item);
            this.update(info);
        });
    }

    infoOf(id) { return this.infos[id]; }

    update(info) {
        this.infos[info.id] = info;
    }
}
