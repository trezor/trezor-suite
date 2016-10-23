/* @flow
 * Transaction history
 */

import { chainContainsAddress } from './discovery';

import type { Output } from 'bitcoinjs-lib';
import type { TransactionInfo, TransactionMap } from './transaction';
import type { Chain } from './discovery';

export type TransactionImpactType = 'incoming' | 'outgoing' | 'internal';
export type TransactionImpactBalanceless = {
    id: string;                  // tx id
    height: ?number;             // latest known height of the tx info
    timestamp: ?number;          // timestamp of the tx block

    type: TransactionImpactType; // classification of the impact
    value: number;               // immediate impact on the wallet balance

    targets: Array<{target: Output, index: number}>;      // relevant crediting outputs of the tx

    // TODO: groups targets by address
};
export type TransactionImpact = TransactionImpactBalanceless & {
    balance: number;             // estimated wallet balance after the impact
}

const IMPACT_ORDERING = ['incoming', 'internal', 'outgoing'];

export function deriveImpacts(
    transactions: TransactionMap,
    external: Chain,
    internal: Chain
): Array<TransactionImpact> {
    let impactsBalanceless = transactions.map((info) => {
        return analyzeTransaction(info, transactions, external, internal);
    });

    impactsBalanceless = impactsBalanceless.sort(compareByOldestAndType);

    let prev = null;
    let impacts = impactsBalanceless.map((info: TransactionImpactBalanceless): TransactionImpact => {
        const balance =
            (prev != null)
                ? prev.balance + info.value
                : info.value;
        prev = {
            ...info,
            balance,
        };
        return prev;
    });
    impacts = impacts.reverse();

    return impacts.toArray();
}

export function compareByOldestAndType(
    a: TransactionImpactBalanceless,
    b: TransactionImpactBalanceless
): number {
    const ah = (a.height != null ? a.height : Infinity);
    const bh = (b.height != null ? b.height : Infinity);
    return ((ah - bh) || 0) || // Infinity - Infinity = NaN
        (IMPACT_ORDERING.indexOf(a.type) -
        IMPACT_ORDERING.indexOf(b.type));
}

export function analyzeTransaction(
    {id, tx, height, timestamp, inputIds, outputAddresses}: TransactionInfo,
    transactions: TransactionMap,
    external: Chain,
    internal: Chain
): TransactionImpactBalanceless {
    const isExternal = (a) => a && chainContainsAddress(external, a);
    const isInternal = (a) => a && chainContainsAddress(internal, a);
    const isCredit = (a) => isExternal(a) || isInternal(a);
    const isDebit = (a) => !isCredit(a);

    let nCredit = 0;
    let nDebit = 0;
    let value = 0;

    // subtract debit impact value
    tx.ins.forEach((i, index) => {
        const info = transactions.get(inputIds[index]);
        if (info) {
            const o = info.tx.outs[i.index];
            const a = info.outputAddresses[i.index];
            if (o && isCredit(a)) {
                value -= o.value;
                nDebit++;
            }
        }
    });

    // add credit impact value
    tx.outs.forEach((o, i) => {
        const a = outputAddresses[i];
        if (isCredit(a)) {
            value += o.value;
            nCredit++;
        }
    });

    let targets: Array<{target: Output, index: number}> = [];
    const originalTargets: Array<{target: Output, index: number}> = tx.outs.map((target, index) => {
        return {target, index};
    });

    const joinsplits = tx.joinsplits == null ? 0 : tx.joinsplits.length;

    let type;

    if (nDebit === (tx.ins.length + joinsplits) && nCredit === tx.outs.length) {
        // within the same account
        type = 'internal';
        targets = [];
    } else if (value > 0) {
        // incoming transaction, targets are either external or internal outputs
        type = 'incoming';
        targets = originalTargets.filter(({target, index}) => isExternal(outputAddresses[index]));
        if (targets.length === 0) {
            targets = originalTargets.filter(({target, index}) => isInternal(outputAddresses[index]));
        }
    } else {
        // outgoing transaction, targets are debit outputs
        type = 'outgoing';
        targets = originalTargets.filter(({target, index}) => isDebit(outputAddresses[index]));
        if (targets.length === 0) {
            type = 'internal';
            targets = [];
        }
    }
    const _setAddresses = new Set();
    const uniqueTargets = targets.filter(({target, index}) => {
        const address = outputAddresses[index];
        if (address == null) {
            return true;
        }
        if (_setAddresses.has(address)) {
            return false;
        }
        _setAddresses.add(address);
        return true;
    });

    return {id, height, timestamp, type, targets: uniqueTargets, value};
}
