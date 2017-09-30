/* @flow */
import type {UtxoInfo} from '../discovery';

// -------- Input to algoritm
// array of Request, which is either
//    - 'complete' - address + amount
//    - 'send-max' - address
//    - 'noaddress' - just amount
//    - 'send-max-noaddress' - no other info
export type OutputRequestWithAddress = {
    type: 'complete',
    address: string,
    amount: number, // in satoshis
} | {
    type: 'send-max', // only one in TX request
    address: string,
};

export type OutputRequest = {
    type: 'send-max-noaddress', // only one in TX request
} | {
    type: 'noaddress',
    amount: number,
} | OutputRequestWithAddress;

// ---------- some helper functions

export function isEmpty(
    utxos: Array<UtxoInfo>,
    outputs: Array<OutputRequest>
): boolean {
    return (utxos.length === 0 || outputs.length === 0);
}

export function splitByCompleteness(
    outputs: Array<OutputRequest>
): {
    complete: Array<OutputRequestWithAddress>,
    incomplete: Array<OutputRequest>,
} {
    const result : {
        complete: Array<OutputRequestWithAddress>,
        incomplete: Array<OutputRequest>,
    } = {
        complete: [],
        incomplete: [],
    };

    outputs.forEach(output => {
        if (output.type === 'complete' || output.type === 'send-max') {
            result.complete.push(output);
        } else {
            result.incomplete.push(output);
        }
    });

    return result;
}

export function getMax(
    outputs: Array<OutputRequest>
): {
  exists: boolean,
  id: number,
} {
    // first, call coinselect - either sendMax or bnb
    // and if the input data are complete, also make the whole transaction

    const countMaxRequests = outputs.filter(output => output.type === 'send-max-noaddress' || output.type === 'send-max');
    if (countMaxRequests.length >= 2) {
        throw new Error('TWO-SEND-MAX');
    }

    const id = outputs.findIndex(output => output.type === 'send-max-noaddress' || output.type === 'send-max');
    const exists = countMaxRequests.length === 1;

    return {
        id, exists,
    };
}

