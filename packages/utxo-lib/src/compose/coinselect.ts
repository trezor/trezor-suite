import * as BN from 'bn.js';
import { split as bitcoinJsSplit } from '../coinselect/outputs/split';
import { coinselect as bitcoinJsCoinselect } from '../coinselect';
import { transactionBytes, finalize } from '../coinselect/utils';

import { convertInputs, convertOutputs } from './utils';
import type { ComposeInput, ComposeOutput } from './request';
import type { CoinSelectInput, CoinSelectOutputFinal, CoinSelectOptions } from '../coinselect';
import type { Network } from '../networks';

const SEGWIT_INPUT_SCRIPT_LENGTH = 51; // actually 50.25, but let's make extra room
const INPUT_SCRIPT_LENGTH = 109;
const P2PKH_OUTPUT_SCRIPT_LENGTH = 25;
const P2SH_OUTPUT_SCRIPT_LENGTH = 23;

export type CompleteResult = {
    type: 'true';
    result: {
        inputs: CoinSelectInput[];
        outputs: CoinSelectOutputFinal[];
        max?: string;
        totalSpent: string;
        fee: number;
        feePerByte: number;
        bytes: number;
    };
};

export type Result =
    | CompleteResult
    | {
          type: 'false';
      };

export function coinselect(
    utxos: ComposeInput[],
    rOutputs: ComposeOutput[],
    height: number,
    feeRate: number,
    segwit: boolean,
    countMax: boolean,
    countMaxId: number,
    dustThreshold: number,
    network: Network,
    baseFee?: number,
    floorBaseFee?: boolean,
    dustOutputFee?: number,
    skipUtxoSelection?: boolean,
    skipPermutation?: boolean,
): Result {
    const inputs0 = convertInputs(utxos, height, segwit);
    const outputs0 = convertOutputs(rOutputs, network);
    const options: CoinSelectOptions = {
        inputLength: segwit ? SEGWIT_INPUT_SCRIPT_LENGTH : INPUT_SCRIPT_LENGTH,
        changeOutputLength: segwit ? P2SH_OUTPUT_SCRIPT_LENGTH : P2PKH_OUTPUT_SCRIPT_LENGTH,
        dustThreshold,
        baseFee,
        floorBaseFee,
        dustOutputFee,
        skipPermutation,
    };

    const algorithm = countMax ? bitcoinJsSplit : bitcoinJsCoinselect;
    // finalize using requested custom inputs or use coin select algorith
    const result =
        skipUtxoSelection != null && !countMax
            ? finalize(inputs0, outputs0, feeRate, options)
            : algorithm(inputs0, outputs0, feeRate, options);
    if (!result.inputs || !result.outputs) {
        return {
            type: 'false',
        };
    }

    const { fee, inputs, outputs } = result;
    const max = countMaxId !== -1 ? outputs[countMaxId].value : undefined;

    const totalSpent = outputs
        .filter((_output, i) => i !== rOutputs.length)
        .map(o => o.value)
        .reduce((a, b) => a.add(new BN(b)), new BN(0))
        .add(new BN(fee))
        .toString();

    const bytes = transactionBytes(inputs, outputs);
    const feePerByte = fee / bytes;

    return {
        type: 'true',
        result: {
            inputs,
            outputs,
            fee,
            feePerByte,
            bytes,
            max,
            totalSpent,
        },
    };
}
