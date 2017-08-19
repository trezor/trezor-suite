/* @flow */

// $FlowIssue
import bitcoinJsSplit from 'coinselect/split';
import bitcoinJsCoinselect from 'coinselect';
import {
    address as BitcoinJsAddress,
} from 'bitcoinjs-lib-zcash';
import type {
    Network as BitcoinJsNetwork,
} from 'bitcoinjs-lib-zcash';

import type {UtxoInfo} from '../discovery';

type OutputRequestWithAddress = {
    type: 'complete',
    address: string,
    amount: number, // in satoshis
} | {
    type: 'send-max', // only one in TX request
    address: string,
};

type OutputRequest = {
    type: 'send-max-noaddress', // only one in TX request
} | {
    type: 'noaddress',
    amount: number,
} | OutputRequestWithAddress

type TxCalculationRequest = {
    outputs: Array<OutputRequest>,
    height: number,
}

type GuiOutputResult = {
    amount: number, // when counting max
}

// types copied from trezor.js
type TrezorOutputResult = {
    path: Array<number>,
    value: number,
    segwit: boolean,
} | {
    address: string,
    value: number,
};

type TrezorInputResult = {
    hash: Buffer,
    index: number,
    path: Array<number>,
    segwit: boolean,
    amount?: number, // only with segwit
};

// Class for permutation
class Permutation<X> {
    sorted: Array<X> = [];

    // Permutation is an array,
    // where on Ith position is J, which means that Jth element in the original, unsorted
    // output array
    // is Ith in the new array.
    _permutation: Array<number>;

    constructor(original: Array<X>, sort: ((a: X, b: X) => number) | Array<number>) {
        // I am "sorting range" - (0,1,2,3,...)
        // so I got the indexes and not the actual values inside
        if (typeof sort === 'object' && sort instanceof Array) {
            this.sorted = original;
            this._permutation = sort;
        } else {
            const sortFun: ((a: X, b: X) => number) = sort;
            const range = [...original.keys()];
            const permutation = range.sort((a, b) => sortFun(original[a], original[b]));
            this._permutation = permutation;

            this.forEach((originalIx, newIx) => {
                this.sorted[newIx] = original[originalIx];
            });
        }
    }

    forEach(f: (originalIx: number, sortedIx: number) => void) {
        this._permutation.forEach(f);
    }

    map<Y>(fun: (p: X) => Y) {
        return new Permutation(this.sorted.map(fun), this._permutation);
    }
}

type TrezorTxResult = {
    inputs: Array<TrezorInputResult>,
		outputs: Permutation<TrezorOutputResult>, // not in trezor.js, but needed for metadata saving
};

export const foobar: TrezorTxResult = {
    inputs: [],
    outputs: new Permutation([], (x, y) => -1),
};

// What I want from this library?
// (1) output info to display
// (2) something to push to trezor, if there is enough information

type TxCalculationResult = {
    type: 'incomplete',
    guiResults: Array<GuiOutputResult>,
    fee: ?number,
    error: ?string,
} | {
    type: 'complete',
    guiResults: Array<GuiOutputResult>,
    fee: number,
    trezorTx: TrezorTxResult,
};

type CoinselectInput = {
    id: number,
    script: {
        length: number,
    },
    value: number,

    own: boolean,
    coinbase: boolean,
    confirmations: number,
}

type CoinselectOutputIn = {
    value?: number,
    script: {
        length: number,
    },
}

type CoinselectOutputOut = {
    value: number,
    script?: {
        length: number,
    },
}

type CoinselectResult = {
    type: 'true',
    result: {
        inputs: Array<CoinselectInput>,
        outputs: Array<CoinselectOutputOut>,
        fee: number,
    },
} | {
    type: 'false',
}

export function createTransaction(
    utxos: Array<UtxoInfo>,
    request: TxCalculationRequest,
    feeRate: number, // in sat/byte, virtual size
    segwit: boolean,
    inputAmounts: boolean, // BIP 143 - not same as segwit (BCash)
    basePath: Array<number>, // for trezor inputs
    network: BitcoinJsNetwork,
    changeId: number,
    changeAddress: string
): TxCalculationResult {
    // first, call coinselect - either sendMax or bnb
    // and if the input data are complete, also make the whole transaction

    const countMaxRequests = request.outputs.filter(output => output.type === 'send-max-noaddress' || output.type === 'send-max');
    if (countMaxRequests.length >= 2) {
        throw new Error('Cannot count two send-max');
    }

    const doCountMax = countMaxRequests === 1;

    const result: CoinselectResult = coinSelect(utxos, request, feeRate, segwit, doCountMax);

    const guiResults = result.type === 'false' ? [] : result.result.inputs.map(r => ({ amount: r.value }));
    const fee = result.type === 'false' ? null : result.result.fee;
    const error = result.type === 'false' ? 'Not enough funds.' : null;

    const incompleteRequests = request.outputs.filter(output => output.type === 'noaddress' || output.type === 'send-max-noaddress');
    if (incompleteRequests.length !== 0) {
        return {
            type: 'incomplete',
            guiResults,
            fee,
            error,
        };
    }

    if (result.type === 'false') {
        return {
            type: 'incomplete',
            guiResults,
            fee,
            error,
        };
    } else {
        const fee_ = result.result.fee;
        // $FlowIssue
        const requestsWithAddresses: Array<OutputRequestWithAddress> = result.outputs;

        const trezorTx = createTrezorTx(
            utxos,
            result.result.inputs,
            requestsWithAddresses,
            result.result.outputs,
            segwit,
            inputAmounts,
            basePath,
            changeId,
            changeAddress,
            network
        );
        return {
            type: 'complete',
            guiResults,
            fee: fee_,
            trezorTx,
        };
    }
}

function inputComparator(aHash: Buffer, aVout: number, bHash: Buffer, bVout: number) {
    return reverseBuffer(aHash).compare(reverseBuffer(bHash)) || aVout - bVout;
}

function outputComparator(aScript: Buffer, aValue: number, bScript: Buffer, bValue: number) {
    return aValue - bValue || aScript.compare(bScript);
}

function createTrezorTx(
    allInputs: Array<UtxoInfo>,
    selectedInputs: Array<CoinselectInput>,
    allOutputs: Array<OutputRequestWithAddress>,
    selectedOutputs: Array<CoinselectOutputOut>,
    segwit: boolean,
    inputAmounts: boolean,
    basePath: Array<number>,
    changeId: number,
    changeAddress: string,
    network: BitcoinJsNetwork
): TrezorTxResult {
    const convertedInputs = selectedInputs.map(input => {
        const id = input.id;
        const richInput = allInputs[id];
        return convertTrezorInput(
            richInput,
            segwit,
            inputAmounts,
            basePath
        );
    });
    const convertedOutputs = selectedOutputs.map((output, i) => {
        // change is always without script and last
        const isChange = output.script == null;

        const address = isChange ? changeAddress : allOutputs[i].address;
        const amount = output.value;
        return convertTrezorOutput(
            address,
            amount,
            network,
            basePath,
            changeId,
            isChange,
            segwit
        );
    });
    convertedInputs.sort((a, b) => {
        return inputComparator(a.hash, a.index, b.hash, b.index);
    });
    const permutedOutputs = new Permutation(convertedOutputs, (a, b) => {
        return outputComparator(a.script, a.output.value, b.script, b.output.value);
    }).map(o => o.output);
    return {
        inputs: convertedInputs,
        outputs: permutedOutputs,
    };
}

function convertTrezorInput(
    utxo: UtxoInfo,
    segwit: boolean,
    inputAmounts: boolean,
    basePath: Array<number>
): TrezorInputResult {
    const res = {
        hash: reverseBuffer(new Buffer(utxo.transactionHash, 'hex')),
        index: utxo.index,
        path: basePath.concat([...utxo.addressPath]),
        segwit: segwit,
    };
    if (inputAmounts) {
        return {
            ...res,
            amount: utxo.value,
        };
    }
    return res;
}

function convertTrezorOutput(
    address: string,
    value: number,
    network: BitcoinJsNetwork,
    basePath: Array<number>,
    changeId: number,
    isChange: boolean,
    segwit: boolean
): {
    output: TrezorOutputResult,
    script: Buffer,
} {
    const output: TrezorOutputResult = isChange ? {
        path: [...basePath, 1, changeId],
        segwit,
        value,
    } : {
        address: address,
        value,
    };

    return {
        output,
        script: BitcoinJsAddress.toOutputScript(address, network),
    };
}

function convertInputs(
    inputs: Array<UtxoInfo>,
    height: number,
    segwit: boolean
): Array<CoinselectInput> {
    const bytesPerInput = this.segwit ? 91 : 149;
    return inputs.map((input, i) => ({
        id: i,
        script: {length: bytesPerInput},
        value: input.value,
        own: input.own,
        coinbase: input.coinbase,
        confirmations: input.height == null
            ? 0
            : (1 + height - input.height),
    }));
}

function convertOutputs(
    outputs: Array<OutputRequest>
): Array<CoinselectOutputIn> {
    const script = {length: 35};
    return outputs.map(output => {
        if (output.type === 'complete' || output.type === 'noaddress') {
            return {
                value: output.amount,
                script,
            };
        }
        if (output.type === 'send-max' || output.type === 'send-max-noaddress') {
            return {
                script,
            };
        }
        throw new Error();
    });
}

function coinSelect(
    utxos: Array<UtxoInfo>,
    request: TxCalculationRequest,
    feeRate: number,
    segwit: boolean,
    countMax: boolean
): CoinselectResult {
    const inputs = convertInputs(utxos, request.height, segwit);
    const outputs = convertOutputs(request.outputs);
    const algorithm = countMax ? bitcoinJsSplit : bitcoinJsCoinselect;
    const result = algorithm(inputs, outputs, feeRate);
    if (result.inputs) {
        return {
            type: 'false',
        };
    } else {
        return {
            type: 'true',
            result,
        };
    }
}

export function reverseBuffer(src: Buffer): Buffer {
    const buffer = new Buffer(src.length);
    for (let i = 0, j = src.length - 1; i <= j; ++i, --j) {
        buffer[i] = src[j];
        buffer[j] = src[i];
    }
    return buffer;
}
