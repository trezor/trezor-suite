import { split as bitcoinJsSplit } from '../coinselect/outputs/split';
import { coinselect as bitcoinJsCoinselect } from '../coinselect';
import { CoinSelectRequest, CoinSelectSuccess, CoinSelectFailure } from '../types';

export function coinselect(request: CoinSelectRequest): CoinSelectSuccess | CoinSelectFailure {
    const { sendMaxOutputIndex } = request;
    const algorithm = sendMaxOutputIndex >= 0 ? bitcoinJsSplit : bitcoinJsCoinselect;
    // finalize using requested custom inputs or use coin select algorithm
    return algorithm(request.inputs, request.outputs, request.feeRate, request);
}
