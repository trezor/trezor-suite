/* @flow
 * Transaction history
 */

import * as baddress from 'bitcoinjs-lib';
import type {Output} from 'bitcoinjs-lib';
import type {TxInfo, TxCollection} from './transaction';
import type {Chain} from './discovery';

export type TxImpactType = 'incoming' | 'outgoing' | 'internal';
export type TxImpact = {
    id: string;
    height: ?number;
    timestamp: number;
    balance: number;
    value: number;
    type: TxImpactType;
    targets: Array<Output>;
};

const IMPACT_TYPES = ['incoming', 'internal', 'outgoing'];

export function deriveImpacts(
    collection: TxCollection,
    external: Chain,
    internal: Chain
): Array<TxImpact> {

    let impacts = collection.asArray().map((i) => {
        return analyzeTransaction(i, collection, external, internal);
    });

    impacts.sort(compareByOldestAndType);
    impacts.reduce((ip, i) => {
        if (ip != null) {
            i.balance = ip.balance + i.value;
        } else{
            i.balance = i.value;
        }
        return i;
    }, null);
    impacts.reverse();

    return impacts;
}

export function compareByOldestAndType(a: TxImpact, b: TxImpact): number {
    let ah = (a.height != null ? a.height : Infinity);
    let bh = (b.height != null ? b.height : Infinity);
    return (ah - bh) || (IMPACT_TYPES.indexOf(a.type) - IMPACT_TYPES.indexOf(b.type));
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
