import * as BN from 'bn.js';
import { split as bitcoinJsSplit } from '../coinselect/outputs/split';
import { coinselect as bitcoinJsCoinselect } from '../coinselect';
import { getFeePolicy, transactionBytes } from '../coinselect/coinselectUtils';
import { convertInputs, convertOutputs } from './composeUtils';
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
    changeAddress: string,
    feeRate: number,
    longTermFeeRate: number | undefined,
    countMax: boolean,
    countMaxId: number,
    dustThreshold: number,
    network: Network,
    baseFee?: number,
    floorBaseFee?: boolean,
    skipPermutation?: boolean,
): CoinSelectSuccess | CoinSelectFailure {
    const inputs0 = convertInputs(utxos, txType);
    const outputs0 = convertOutputs(rOutputs, network, txType);
    const feePolicy = getFeePolicy(network);
    // NOTE: use "send-max" to create CoinSelectOutput since we don't know the final amount yet
    const [changeOutput] = convertOutputs(
        [{ type: 'send-max', address: changeAddress }],
        network,
        txType,
    );
    const options: CoinSelectOptions = {
        txType,
        changeOutput,
        dustThreshold,
        longTermFeeRate,
        baseFee,
        floorBaseFee,
        skipPermutation,
        feePolicy,
    };

    const algorithm = countMax ? bitcoinJsSplit : bitcoinJsCoinselect;
    // finalize using requested custom inputs or use coin select algorithm
    const result = algorithm(inputs0, outputs0, feeRate, options);
    if (!result.inputs || !result.outputs) {
        return { success: false };
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
        success: true,
        payload: {
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
