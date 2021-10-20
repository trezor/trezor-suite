import type { Network } from '../networks';

// UTXO == unspent transaction output = all I can spend
export type ComposeInput = {
    index: number; // index of output IN THE TRANSACTION
    transactionHash: string; // hash of the transaction
    value: string; // how much money sent
    addressPath: [number, number]; // path
    height?: number; // null == unconfirmed
    coinbase: boolean; // coinbase transaction = utxo from mining, cannot be spend before 100 blocks
    tsize: number; // total size - in case of segwit, total, with segwit data
    vsize: number; // virtual size - segwit concept - same as size in non-segwit
    own: boolean; // is the ORIGIN me (the same account)
    required?: boolean; // must be included into transaction
    confirmations?: number; // TODO
};

// Input to coinselect algorithm.
// array of Request, which is either
//    - 'complete' - address + amount
//    - 'send-max' - address
//    - 'noaddress' - just amount
//    - 'send-max-noaddress' - no other info
export type ComposeFinalOutput =
    | {
          // TODO rename
          type: 'complete';
          address: string;
          amount: string; // in satoshi
      }
    | {
          type: 'send-max'; // only one in TX request
          address: string;
      }
    | {
          type: 'opreturn'; // it doesn't need to have address
          dataHex: string;
      };

export type ComposeNotFinalOutput =
    | {
          type: 'send-max-noaddress'; // only one in TX request
      }
    | {
          type: 'noaddress';
          amount: string;
      };

export type ComposeOutput = ComposeFinalOutput | ComposeNotFinalOutput;

export type ComposeRequest = {
    utxos: ComposeInput[]; // all inputs
    outputs: ComposeOutput[]; // all output "requests"
    height: number;
    feeRate: string; // in sat/byte, virtual size
    segwit: boolean;
    inputAmounts: boolean; // BIP 143 - not same as segwit (BCash)
    basePath: number[]; // for trezor inputs
    network: Network;
    changeId: number;
    changeAddress: string;
    dustThreshold: number; // explicit dust threshold, in satoshi
    baseFee?: number; // DOGE base fee
    floorBaseFee?: boolean; // DOGE floor base fee to the nearest integer
    dustOutputFee?: number; // DOGE fee for every output below dust limit
    skipUtxoSelection?: boolean; // use custom utxo selection, without algorithm
    skipPermutation?: boolean; // Do not sort inputs/outputs and preserve the given order. Handy for RBF.
};

export function splitByCompleteness(outputs: ComposeOutput[]) {
    const complete: ComposeFinalOutput[] = [];
    const incomplete: ComposeNotFinalOutput[] = [];

    outputs.forEach(output => {
        if (
            output.type === 'complete' ||
            output.type === 'send-max' ||
            output.type === 'opreturn'
        ) {
            complete.push(output);
        } else {
            incomplete.push(output);
        }
    });

    return {
        complete,
        incomplete,
    };
}

export function getMax(outputs: ComposeOutput[]) {
    // first, call coinselect - either sendMax or bnb
    // and if the input data are complete, also make the whole transaction

    const countMaxRequests = outputs.filter(
        output => output.type === 'send-max-noaddress' || output.type === 'send-max',
    );
    if (countMaxRequests.length >= 2) {
        throw new Error('TWO-SEND-MAX');
    }

    const id = outputs.findIndex(
        output => output.type === 'send-max-noaddress' || output.type === 'send-max',
    );
    const exists = countMaxRequests.length === 1;

    return {
        id,
        exists,
    };
}
