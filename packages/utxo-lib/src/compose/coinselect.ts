import BN from 'bn.js';
import { split as bitcoinJsSplit } from '../coinselect/outputs/split';
import { coinselect as bitcoinJsCoinselect } from '../coinselect';
import { transactionBytes } from '../coinselect/coinselectUtils';
import { CoinSelectRequest, CoinSelectSuccess, CoinSelectFailure } from '../types';

export function coinselect(request: CoinSelectRequest): CoinSelectSuccess | CoinSelectFailure {
    const { sendMaxOutputIndex } = request;
    const algorithm = sendMaxOutputIndex >= 0 ? bitcoinJsSplit : bitcoinJsCoinselect;
    // finalize using requested custom inputs or use coin select algorithm
    const result = algorithm(request.inputs, request.outputs, request.feeRate, request);
    if (!result.inputs || !result.outputs) {
        return { success: false };
    }

    const { fee, inputs, outputs } = result;
    const max = sendMaxOutputIndex >= 0 ? outputs[sendMaxOutputIndex].value : undefined;

    const totalSpent = outputs
        .filter((_output, i) => i !== request.outputs.length)
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
