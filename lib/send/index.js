/* @flow */

type OutputRequest = {
    type: 'complete';
    address: string;
    amount: number; // in satoshis
} | {
    type: 'missing-address';
    amount: number;
} | {
    type: 'send-max'; // only one in TX request
    address: string;
};

type TxCalculationRequest = {
    outputs: Array<OutputRequest>;
    height: number;
}

// What I want from this library?
// (1) output info to display
// (2) something to push to trezor, if there is enough information

type TxCalculationResult = {
    type: 'incomplete';
    guiResults: Array<GuiOutputResult>;
    fee: number;
    error: ?string;
} | {
    type: 'complete';
    guiResults: Array<GuiOutputResult>;
    fee: number;
};

// types copied from trezor.js
type TrezorOutputResult = {
    path: Array<number>;
    value: number;
    segwit: boolean;
} | {
    address: string;
    value: number;
};

type TrezorInputResult = {
    hash: Buffer;
    index: number;
    path: Array<number>;
    segwit: boolean;
    amount?: number; // only with segwit
};

type TrezorTxResult = {
    inputs: Array<InputResult>;
    outputs: Array<OutputResult>;
		permutation: OutputPermutation; // not in trezor.js, but needed for metadata saving
};

type GuiOutputResult = {
    error: ?string;
    amount: number; // when counting max
}

// Class for permutation of outputs
class OutputPermutation {
    // Permutation is an array,
    // where on Ith position is J, which means that Jth position in the original, unsorted
    // output array
    // is Ith in the new array.
    _permutation: Array<number>;

    constructor(outputs: Array<OutputResult>) {
        // I am "sorting range" - (0,1,2,3,...)
        // so I got the indexes and not the actual values inside

        // I am sorting by negative values, so I got the smaller last, bigger first
        const permutation = sortBy(range(outputs.length),
            i => [-(outputs[i].value)]);
        this._permutation = permutation;
    }

    shuffleOutputs(outputs: Array<OutputResult>): Array<OutputResult> {
        const shuffled = at(outputs, this._permutation);
        return shuffled;
    }

    forEach(f: (unsortedIx: number, sortedIx: number) => void) {
        this._permutation.forEach(f);
    }
}

type CoinselectInput = {
    id: number;
    script: {
        length: number;
    };
    value: number;

    own: boolean;
    coinbase: boolean;
    confirmations: number;
}

type CoinselectOutput = {
    value?: number;
    script: {
        length: number;
    }
}

function createTransaction(
    utxos: Array<UtxoInfo>,
    request: TxCalculationRequest,
		changePath: Array<number>,
    feeRate: number, // in sat/byte, virtual size
    segwit: boolean
): TxCalculationResult {
    // first, call coinselect - either sendMax or bnb
    // and if the input data are complete, also make the whole transaction
    
    const countMaxRequests = request.outputs.filter(utxo => output.type === 'send-max');
    if (countMaxRequests.length >= 2) {
        throw new Error('Cannot count two send-max');
    }

    const doCountMax = countMaxRequests === 1;

}

type CoinselectResult = {
    type: 'true';
    result: {
        inputs: CoinselectInput;
        outputs: CoinselectOutput;
        fee: number;
    }
} | {
    type: 'false';
}

function convertInputs(
    inputs: Array<UtxoInfo>,
    height: number,
    segwit: boolean
): Array<CoinselectInput> {
    const bytesPerInput = this.segwit ? 91 : 149;
    return inputs.map((input, i) => ({
        index: i,
        script: {length: bytesPerInput},
        value: input.value,
        own: input.own,
        coinbase: input.coinbase,
        confirmations: input.height == null ? 
            0 
            : (1 + height - input.height)
    }))
}

function convertOutputs(
    outputs: Array<OutputRequest>
): Array<CoinselectOutput> {
    const script = {length: 35};
    return outputs.map(output => {
        if (output.type === 'complete') {
            return {
                value: output.amount,
                script
            }
        }
        if (output.type === 'missing-address') {
            return {
                value: output.amount,
                script
            }
        }
        if (output.type === 'send-max') {
            return {
                script
            }
        }
        throw new Error();
    })
}

function coinSelect(
    utxos: Array<UtxoInfo>,
    request: TxCalculationRequest,
    feeRate: number,
    segwit: boolean,
    countMax: boolean
): CoinselectResult {
    var inputs = convertInputs(utxos, request.height, segwit);
    var outputs = convertOutputs(request.outputs)
    var algorithm = countMax ? bitcoinJsSplit : bitcoinJsCoinselect;
    var result = algorigthm(inputs, outputs, feeRate)
    if (result.inputs) {
        return {
            type: 'false'
        }
    } else {
        return {
            type: 'true',
            result
        }
    }
}

