export class Unspent {
    constructor(hash, index, value) {
        this.hash = hash;
        this.index = index;
        this.value = value;
    }
}

export function collectUnspents(db) {
    let txs = db.getAll();
    let spent = [];
    let unspents = [];

    // spent outputs
    txs.forEach((tx) => {
        tx.ins.forEach((i) => {
            let o = db.infoOf(i.hash).outs[i.index];
            if (o) {
                spent.push(o);
            }
        });
    });

    // unspents
    txs.forEach((tx) => {
        tx.outs.forEach((o) => {
            if (spent.indexOf(o) < 0) {
                unspents.push(new Unspent(tx.hash, o.index, o.value));
            }
        });
    });

    return unspents;
}

export class Wallet {

}
