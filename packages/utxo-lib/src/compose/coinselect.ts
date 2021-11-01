import * as BN from 'bn.js';
import { split as bitcoinJsSplit } from '../coinselect/outputs/split';
import { coinselect as bitcoinJsCoinselect } from '../coinselect';
import { transactionBytes, finalize } from '../coinselect/utils';
import * as utils from './utils';
import type { ComposeInput, ComposeOutput } from './request';
import type { CoinSelectInput, CoinSelectOutputFinal, CoinSelectOptions } from '../coinselect';
import type { Network } from '../networks';

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
    txType: utils.TxType,
    utxos: ComposeInput[],
    rOutputs: ComposeOutput[],
    height: number,
    feeRate: number,
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
    const inputs0 = utils.convertInputs(utxos, height, txType);
    const outputs0 = utils.convertOutputs(rOutputs, network, txType);
    const options: CoinSelectOptions = {
        inputLength: utils.INPUT_SCRIPT_LENGTH[txType],
        changeOutputLength: utils.OUTPUT_SCRIPT_LENGTH[txType],
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
