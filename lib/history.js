/* @flow
 * Transaction history
 */

import * as baddress from 'bitcoinjs-lib';
import type {Output} from 'bitcoinjs-lib';
import type {TxInfo, TxCollection} from './transaction';
import type {Chain} from './discovery';

export type TxImpactType = 'incoming' | 'outgoing' | 'internal';
export type TxImpact = {
    id: string;             // tx id
    height: ?number;        // latest known height of the tx info
    timestamp: number;      // time the backend has first seen the tx
    balance: number;        // estimated wallet balance after the impact
    value: number;          // immediate impact on the wallet balance
    type: TxImpactType;     // classification of the impact
    targets: Array<Output>; // relevant crediting outputs of the tx
};

const IMPACT_ORDERING = ['incoming', 'internal', 'outgoing'];

export function deriveImpacts(
    collection: TxCollection,
    external: Chain,
    internal: Chain
): Array<TxImpact> {

    let impacts = collection.asArray().map((info) => {
        return analyzeTransaction(info, collection, external, internal);
    });

    impacts.sort(compareByOldestAndType);
    impacts.reduce((prev, info) => {
        if (prev != null) {
            info.balance = prev.balance + info.value;
        } else {
            info.balance = info.value;
        }
        return info;
    }, null);
    impacts.reverse();

    return impacts;
}

export function compareByOldestAndType(a: TxImpact, b: TxImpact): number {
    let ah = (a.height != null ? a.height : Infinity);
    let bh = (b.height != null ? b.height : Infinity);
    return (ah - bh)
        || (IMPACT_ORDERING.indexOf(a.type) -
            IMPACT_ORDERING.indexOf(b.type));
}

export function analyzeTransaction(
    {id, tx, height, timestamp}: TxInfo,
    collection: TxCollection,
    external: Chain,
    internal: Chain
): TxImpact {

    let isExternal = (o) => o.address && external.contains(o.address);
    let isInternal = (o) => o.address && internal.contains(o.address);
    let isCredit = (o) => isExternal(o) || isInternal(o);
    let isDebit = (o) => !isCredit(o);

    let nCredit = 0;
    let nDebit = 0;
    let value = 0;

    // subtract debit impact value
    tx.ins.forEach((i) => {
        let o = collection.outputOf(i.id, i.index);
        if (o && isCredit(o)) {
            value -= o.value;
            nDebit++;
        }
    });

    // add credit impact value
    tx.outs.forEach((o) => {
        if (isCredit(o)) {
            value += o.value;
            nCredit++;
        }
    });

    let targets;
    let type;

    if (nDebit === tx.ins.length && nCredit === tx.outs.length) {
        // within the same account
        type = 'internal';
        targets = [];

    } else if (value > 0) {
        // incoming transaction, targets are either external or internal outputs
        type = 'incoming';
        targets = tx.outs.filter(isExternal);
        if (targets.length === 0) {
            targets = tx.outs.filter(isInternal);
        }

    } else {
        // outgoing transaction, targets are debit outputs
        type = 'outgoing';
        targets = tx.outs.filter(isDebit);
    }

    let balance = 0;

    return {id, height, timestamp, balance, type, targets, value};
}
