/* @flow */
import type {
    ChainNewTransaction,
    ChainNewTransactions,
    AddressToPath,
    TransactionInfoBalanceless,
    TargetsType,
} from '../types';
import type {
    TransactionInfo,
    TargetInfo,
} from '../../index';

import {
    objectValues,
    getInputId,
} from '../utils';

import {
    deriveDateFormats,
} from './dates';

import {
    Transaction as BitcoinJsTransaction,
} from 'bitcoinjs-lib-zcash';

type OutputForAnalysis = ?{address: string, value: number};
type OutputsForAnalysis = Array<OutputForAnalysis>;
type OutputsForAnalysisMap = {[txid: string]: OutputsForAnalysis};

// Pretty complicated function for deriving transaction analysis.
//
// Transaction analysis is a little heuristic - I have transactions and I try
// to find out which are "positive" and which are "negative"
// and which outputs to "display to user"
//
// Also, what is the "effective balance" of the transaction
//
// I do not re-analyze old transactions, I just analyze new transactions

export function deriveAnalysis(
    newTransactions: ChainNewTransactions,
    oldTransactions: Array<TransactionInfo>,
    addressToPath: AddressToPath
) {
    // I need the outputs in format txid+i -> address/value
    // For old transactions, that are in history, I just need my outputs
    // For new transactions, I need all outputs (I will be analyzing them)
    const outputsForAnalysis = deriveOutputsForAnalysisMap(
        newTransactions,
        oldTransactions
    );

    // For each tx, derive info about its impact,
    // but since we don't know order, we don't know balance after it
    const analysis = deriveBalancelessAnalysisMap(
        newTransactions,
        oldTransactions,
        outputsForAnalysis,
        addressToPath
    );

    // Add "balance" (which means balance after the transaction)
    const transactions = deriveFullInfo(analysis);
    return transactions;
}

// All info about outputs
function deriveOutputsForAnalysisMap(
    newTs: ChainNewTransactions,
    oldTs: Array<TransactionInfo>
): OutputsForAnalysisMap {
    // Take only my outputs from old
    function getOutputsFromOldTransaction(t: TransactionInfo): {
        txid: string,
        outputs: OutputsForAnalysis,
    } {
        const outputs = [];
        Object.keys(t.myOutputs).forEach(i => {
            outputs[parseInt(i)] = t.myOutputs[parseInt(i)];
        });
        const txid = t.hash;
        return {txid, outputs};
    }

    // take all info from new txs, since I will be going throug them 1 by 1
    function getOutputsFromNewTransaction(t: ChainNewTransaction): {
        txid: string,
        outputs: OutputsForAnalysis,
    } {
        const outputs = [];
        for (let i = 0; i < t.tx.outs.length; i++) {
            const output = t.tx.outs[i];
            const address = t.outputAddresses[i];
            outputs.push({address, value: output.value});
        }
        const txid = t.hash;
        return {txid, outputs};
    }

    const res = {};
    const newOutputs = objectValues(newTs).map(t => getOutputsFromNewTransaction(t));
    const oldOutputs = oldTs.map(t => getOutputsFromOldTransaction(t));

    // new txs are replacing the old ones
    // (rare case - new tx can have new address "discovered")
    oldOutputs.concat(newOutputs).forEach(({txid, outputs}) => {
        res[txid] = outputs;
    });
    return res;
}

function deriveBalancelessAnalysisMap(
    newTs: ChainNewTransactions,
    oldTs: Array<TransactionInfo>,
    outputs: OutputsForAnalysisMap,
    addressToPath: AddressToPath
): {[id: string]: TransactionInfoBalanceless} {
    const res = {};
    // first, save the old ones
    oldTs.forEach(t => {
        res[t.hash] = t;
    });
    Object.keys(newTs).forEach(id => {
        res[id] = analyzeTransaction(newTs[id], outputs, addressToPath);
    });
    return res;
}

// Analyze single transaction
function analyzeTransaction(
    t: ChainNewTransaction,
    outputs: OutputsForAnalysisMap,
    addressToPath: AddressToPath
): TransactionInfoBalanceless {
    const inputIds = t.tx.ins.map(input =>
        ({id: getInputId(input), index: input.index})
    );
    const hasJoinsplits = t.tx.joinsplits == null ? true : t.tx.joinsplits.length > 0;

    const isCoinbase = t.tx.ins.some((i) => BitcoinJsTransaction.isCoinbaseHash(i.hash));

    const hash = t.hash;

    // the main logic is here
    const targets = getTargetsFromTransaction(
        inputIds,
        outputs,
        addressToPath,
        hash,
        hasJoinsplits
    );
    const dates = deriveDateFormats(t.timestamp);

    return {
        isCoinbase,
        ...dates,
        height: t.height,
        hash,
        ...targets,
        inputs: inputIds,
        tsize: t.tx.byteLength(),
        vsize: t.vsize,
        fee: t.fee,
    };
}

function getTargetsFromTransaction(
    inputIds: Array<{id: string, index: number}>,
    outputs: OutputsForAnalysisMap,
    addressToPath: AddressToPath,
    id: string,
    hasJoinsplits: boolean,
): TargetsType {
    const currentOutputs = outputs[id];

    let nCredit = 0;
    let nDebit = 0;
    let value = 0;

    // testing if address is mine / change / not change / ...
    function isExternal(a: ?string): boolean {
        return (a != null && addressToPath[a] != null && addressToPath[a][0] === 0);
    }

    function isInternal(a: ?string): boolean {
        return (a != null && addressToPath[a] != null && addressToPath[a][0] === 1);
    }

    function isCredit(a: ?string): boolean {
        return (a != null && addressToPath[a] != null);
    }

    function isDebit(a: ?string): boolean {
        return !isCredit(a);
    }

    // subtract debit impact value

    // Transaction is TAKING me my money,
    // if its input is mine
    // == if its input belongs to a transaction that's mine AND the address of corresponding output is mine
    inputIds.forEach(({id, index}) => {
        const info = outputs[id];
        if (info) {
            const output = info[index];
            if (output) {
                if (isCredit(output.address)) {
                    value -= output.value;
                    nDebit++;
                }
            }
        }
    });

    const myOutputs: {[i: number]: TargetInfo} = {};

    // add credit impact value

    // Transansction is GIVING me money,
    // if its output has address that is mine. (On any chain.)
    currentOutputs.forEach((output, i) => {
        if (output != null) {
            if (isCredit(output.address)) {
                value += output.value;
                nCredit++;
                myOutputs[i] = {address: output.address, value: output.value, i};
            }
        }
    });

    let targets: Array<TargetInfo> = [];

    function filterTargets(filterFunction: (address: string) => boolean): Array<TargetInfo> {
        const res = [];
        currentOutputs.forEach((info, i) => {
            if (info != null) {
                const {address, value} = info;
                if (filterFunction(address)) {
                    res.push({address, value, i});
                }
            }
        });
        return res;
    }

    let type;

    const insLength = inputIds.length;
    const outsLength = currentOutputs.length;

    // joinsplit is a special (zcash) case - it has no inputs - but outputs still mine

    // if all inputs are mine and all outputs are mine - no targets
    if (nDebit === insLength && (!hasJoinsplits) && nCredit === outsLength) {
        // within the same account
        type = 'self';
        targets = [];
    } else if (value > 0) {
        // incoming transaction, targets are either external or internal outputs
        type = 'recv';
        targets = filterTargets(address => isExternal(address));
        if (targets.length === 0) {
            targets = filterTargets(address => isInternal(address));
        }
    } else {
        // outgoing transaction, targets are debit outputs
        type = 'sent';
        targets = filterTargets(address => isDebit(address));
        if (targets.length === 0) {
            // ? who knows, show self as a backup
            type = 'self';
            targets = [];
        }
    }

    // note that target selection does NOT affect value/balance
    // makes sense - even "sent to self" transactions are negative - cost fee

    return {targets, type, value, myOutputs};
}

// Full info is just analysis sorted and with added balances
function deriveFullInfo(
    analysis: {[id: string]: TransactionInfoBalanceless}
): Array<TransactionInfo> {
    const sortedAnalysis = objectValues(analysis).sort(compareByOldestAndType);

    let prev = null;
    const impacts = sortedAnalysis.map((info: TransactionInfoBalanceless): TransactionInfo => {
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
    return impacts.reverse();
}

const IMPACT_ORDERING = ['recv', 'self', 'sent'];

function compareByOldestAndType(
    a: TransactionInfoBalanceless,
    b: TransactionInfoBalanceless
): number {
    const ah = (a.height != null ? a.height : Infinity);
    const bh = (b.height != null ? b.height : Infinity);
    return ((ah - bh) || 0) || // Infinity - Infinity = NaN
        (IMPACT_ORDERING.indexOf(a.type) -
        IMPACT_ORDERING.indexOf(b.type));
}

