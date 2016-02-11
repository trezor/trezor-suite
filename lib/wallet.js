/* @flow
 * Spending coins
 */

import { script as bscript, Transaction } from 'bitcoinjs-lib';
import type { Output, Network } from 'bitcoinjs-lib';

import { chainContainsAddress } from './discovery';
import type { Chain } from './discovery';
import type { TransactionMap } from './transaction';

/*
 * Reference to an unspent output
 */

export type Unspent = {
    id: string;          // tx id
    index: number;       // output index
    value: number;       // output value
    script: Buffer;      // output script
    height: ?number;     // latest known height of the tx info
    isCoinbase: boolean; // is the tx a coinbase tx?
};

export function collectUnspents(
    transactions: TransactionMap,
    external: Chain,
    internal: Chain
): Array<Unspent> {
    let infos = transactions.asArray();
    let spent = new Set;

    // keep track of spent outputs
    infos.forEach((info) => {
        info.tx.ins.forEach((i) => {
            let o = transactions.getOutput(i.id, i.index);
            if (o) {
                spent.add(o);
            }
        });
    });

    let isCredit = (o) => {
        return o.address &&
               (chainContainsAddress(internal, o.address) ||
                chainContainsAddress(external, o.address));
    };

    let isCoinbase = (tx) => {
        return tx.ins.some((i) => Transaction.isCoinbaseHash(i.hash));
    };

    let unspents = [];

    // collect unspents
    infos.forEach((info) => {
        let coinbase = isCoinbase(info.tx);

        info.tx.outs.forEach((o, index) => {
            if (spent.has(o) || !isCredit(o)) {
                return;
            }
            unspents.push({
                id: info.id,
                index: index,
                value: o.value,
                script: o.script,
                height: info.height,
                isCoinbase: coinbase,
            });
        });
    });

    return unspents;
}

/*
 * Selection of unspents for given outputs
 */

export type CoinSelection = {
    unspents: Array<Unspent>; // unspents, as tx inputs, empty for insufficient funds
    outputs: Array<Output>;   // given tx outputs
    change: number;           // calculated tx change
    fee: number;              // calculated tx fee
};

export function selectUnspents(
    unspents: Array<Unspent>,
    outputs: Array<Output>,
    feePerKB: number
): CoinSelection {
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
            return {
                unspents: candidates,
                outputs: outputs,
                change: incoming - totalWithChange,
                fee: feeWithChange,
            };

        } else {
            return {
                unspents: candidates,
                outputs: outputs,
                change: 0,
                fee: incoming - total,
            };
        }
    }

    // insufficient funds
    return {
        unspents: [],
        outputs: outputs,
        change: 0,
        fee: 0,
    };
}

function estimateFee(byteLength: number, feePerKB: number): number {
    return Math.ceil(byteLength / 1000) * feePerKB;
}

export function integrateSelectionChange(
    selection: CoinSelection,
    address: string,
    threshold: number
): CoinSelection {
    let outputs;
    let fee;

    if (selection.change > threshold) {
        let output = {
            address: address,
            script: bscript.fromAddress(address),
            value: selection.change,
        };
        outputs = selection.outputs.concat(output);
        fee = selection.fee;
    } else {
        outputs = selection.outputs;
        fee = selection.fee + selection.change;
    }

    return {
        ...selection,
        unspents: selection.unspents,
        outputs: outputs,
        change: 0,
        fee: fee,
    };
}

export function sortedSelection(selection: CoinSelection): CoinSelection {
    return selection; // TODO: bip69
}

export function composeTransaction(
    unspents: Array<Unspent>,
    outputs: Array<Output>,
    change: string,
    feePerKB: number,
    dustThreshold: number
): CoinSelection {
    let s;

    s = selectUnspents(unspents, outputs, feePerKB);
    s = integrateSelectionChange(s, change, dustThreshold);
    s = sortedSelection(s);

    return s;
}

/*
 * Preparing unspents for coin selection
 */

function compareByOldestAndSmallest(a: Unspent, b: Unspent): number {
    let ah = (a.height || Infinity);
    let bh = (b.height || Infinity)
    return (ah - bh)            // ascending height
        || (a.value - b.value); // ascending value
}

export function sortedUnspents(unspents: Array<Unspent>): Array<Unspent> {
    return unspents.slice().sort(compareByOldestAndSmallest);
}

export function spendableUnspents(
    unspents: Array<Unspent>,
    currentHeight: number,
    needConfirmations: number = 0,
    needCoinbaseConfirmations: number = 101
): Array<Unspent> {
    return unspents.filter(({isCoinbase, height}) => {
        let confirmations = height == null ? 0 : (currentHeight - height) + 1;
        if (isCoinbase) {
            return confirmations >= needCoinbaseConfirmations;
        } else {
            return confirmations >= needConfirmations;
        }
    });
}

/*
 * Container for a set of currently unspent outputs
 */

export class Wallet {
    unspents: Array<Unspent>;
    network: Network;

    constructor(unspents: Array<Unspent>, network: Network) {
        this.unspents = unspents;
        this.network = network;
    }

    getBalance(): number {
        return this.unspents.reduce((b, u) => b + u.value, 0);
    }

    composeTransaction(
        outputs: Array<Output>,
        change: string,
        currentHeight: number
    ): CoinSelection {
        let unspents = this.unspents;
        unspents = spendableUnspents(unspents, currentHeight);
        unspents = sortedUnspents(unspents);

        return composeTransaction(
            unspents,
            outputs,
            change,
            this.network.feePerKB,
            this.network.dustThreshold
        );
    }
}
