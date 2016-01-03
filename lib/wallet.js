/* @flow
 * Spending coins
 */

import { script as bscript } from 'bitcoinjs-lib';
import type {Transaction, Input, Output, Network } from 'bitcoinjs-lib';
import type {TxCollection} from './transaction';

export type Unspent = {
    id: string;
    index: number;
    value: number;
    script: Buffer;
    height: ?number;
};

export function collectUnspents(collection: TxCollection): Array<Unspent> {
    let infos = collection.asArray();
    let spent = [];
    let unspents = [];

    // keep track of spent outputs
    infos.forEach((info) => {
        info.tx.ins.forEach((i) => {
            let o = collection.outputOf(i.id, i.index);
            if (o) {
                spent.push(o);
            }
        });
    });

    // collect unspents
    infos.forEach((info) => {
        info.tx.outs.forEach((o, index) => {
            if (spent.indexOf(o) < 0) {
                unspents.push({
                    id: info.id,
                    index: index,
                    value: o.value,
                    script: o.script,
                    height: info.height
                });
            }
        });
    });

    return unspents;
}

export function compareByOldestAndSmallest(a: Unspent, b: Unspent): number {
    let ah = (a.height || Infinity);
    let bh = (a.height || Infinity);
    return (ah - bh)             // ascending height
        || (a.value - b.value);  // ascending value
}

export class CoinSelection {
    unspents: Array<Unspent>;
    outputs: Array<Output>;
    change: number;
    fee: number;

    constructor(
        unspents: Array<Unspent>,
        outputs: Array<Output>,
        change: number,
        fee: number
    ) {
        this.unspents = unspents;
        this.outputs = outputs;
        this.change = change;
        this.fee = fee;
    }

    static select(
        unspents: Array<Unspent>,
        outputs: Array<Output>,
        feePerKB: number
    ): ?CoinSelection {
        // based on https://github.com/dcousens/coinselect

        const TX_EMPTY_SIZE = 8;
        const TX_PUBKEYHASH_INPUT = 40 + 2 + 106;
        const TX_PUBKEYHASH_OUTPUT = 8 + 2 + 25;

        let candidates = [];
        let outgoing = 0;
        let incoming = 0;

        let byteLength = TX_EMPTY_SIZE;

        for (let i = 0; i < outputs.length; i++) {
            outgoing += outputs[i].value;
            byteLength += TX_PUBKEYHASH_OUTPUT;
        }

        for (let i = 0; i < unspents.length; i++) {
            incoming += unspents[i].value;
            byteLength += TX_PUBKEYHASH_INPUT;

            candidates.push(unspents[i]);

            if (incoming < outgoing) {
                // don't bother with fees until we cover all outputs
                continue;
            }

            let baseFee = estimateFee(byteLength, feePerKB);
            let total = outgoing + baseFee;

            if (incoming < total) {
                // continue until we can afford the base fee
                continue;
            }

            let feeWithChange = estimateFee(byteLength + TX_PUBKEYHASH_OUTPUT, feePerKB);
            let totalWithChange = outgoing + feeWithChange;

            // can we afford a change output?
            if (incoming >= totalWithChange) {
                let change = incoming - totalWithChange;
                return new CoinSelection(candidates, outputs, change, feeWithChange);

            } else {
                let fee = incoming - total;
                return new CoinSelection(candidates, outputs, 0, fee);
            }
        }

        return null; // insufficient funds
    }

    integrateChange(changeAddress: string, dustThreshold: number) {
        if (this.change > dustThreshold) {
            this.outputs.push({
                address: changeAddress,
                script: bscript.fromAddress(changeAddress),
                value: this.change
            });
            this.change = 0;
        } else {
            this.fee += this.change;
            this.change = 0;
        }
    }

    sort() {
        // TODO: bip69 sort
    }
}

function estimateFee(byteLength: number, feePerKB: number): number {
    return Math.ceil(byteLength / 1000) * feePerKB;
}

export class Wallet {
    unspents: Array<Unspent>;
    network: Network;

    constructor(unspents: Array<Unspent>, network: Network) {
        this.unspents = unspents;
        this.network = network;
    }

    getBalance(): number {
        return this.unspents
            .reduce((b, u) => b + u.value, 0);
    }

    getConfirmedBalance(): number {
        return this.unspents
            .filter((u) => u.height != null)
            .reduce((b, u) => b + u.value, 0);
    }

    composeTx(outputs: Array<Output>, changeAddress: string): ?Transaction {
        let selection = CoinSelection.select(this.unspents, outputs, this.network.feePerKB);
        if (selection) {
            selection.integrateChange(changeAddress, this.network.dustThreshold);
            selection.sort();
        }
        return selection;
    }
}
