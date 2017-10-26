/* @flow */
import type {
    Network as BitcoinJsNetwork,
} from 'bitcoinjs-lib-zcash';

import type {UtxoInfo} from '../discovery';
// -------- Input to algoritm
// array of Request, which is either
//    - 'complete' - address + amount
//    - 'send-max' - address
//    - 'noaddress' - just amount
//    - 'send-max-noaddress' - no other info
export type OutputRequestWithAddress = { // TODO rename
    type: 'complete',
    address: string,
    amount: number, // in satoshis
} | {
    type: 'send-max', // only one in TX request
    address: string,
} | {
    type: 'opreturn', // this is misnomer, since it doesn't need to have address
    dataHex: string,
};

export type OutputRequest = {
    type: 'send-max-noaddress', // only one in TX request
} | {
    type: 'noaddress',
    amount: number,
} | OutputRequestWithAddress;

export type Request = {
    utxos: Array<UtxoInfo>, // all inputs
    outputs: Array<OutputRequest>, // all output "requests"
    height: number,
    feeRate: number, // in sat/byte, virtual size
    segwit: boolean,
    inputAmounts: boolean, // BIP 143 - not same as segwit (BCash)
    basePath: Array<number>, // for trezor inputs
    network: BitcoinJsNetwork,
    changeId: number,
    changeAddress: string,
    dustThreshold: number, // explicit dust threshold, in satoshis
};

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
        if (output.type === 'complete' || output.type === 'send-max' || output.type === 'opreturn') {
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

