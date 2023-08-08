import * as BN from 'bn.js';
import { split as bitcoinJsSplit } from '../coinselect/outputs/split';
import { coinselect as bitcoinJsCoinselect } from '../coinselect';
import { transactionBytes } from '../coinselect/utils';
import * as utils from './utils';
import {
    ComposeInput,
    ComposeOutput,
    CoinSelectPaymentType,
    CoinSelectOptions,
    CoinSelectSuccess,
    CoinSelectFailure,
} from '../types';
import type { Network } from '../networks';

export function coinselect(
    txType: CoinSelectPaymentType,
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
    skipPermutation?: boolean,
): CoinSelectSuccess | CoinSelectFailure {
    const inputs0 = utils.convertInputs(utxos, height, txType);
    const outputs0 = utils.convertOutputs(rOutputs, network, txType);
    const options: CoinSelectOptions = {
        txType,
        dustThreshold,
        baseFee,
        floorBaseFee,
        dustOutputFee,
        skipPermutation,
    };

    const algorithm = countMax ? bitcoinJsSplit : bitcoinJsCoinselect;
    // finalize using requested custom inputs or use coin select algorithm
    const result = algorithm(inputs0, outputs0, feeRate, options);
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
