import { type Random } from '@trezor/wabisabi-crypto';

import { AmountDecomposer } from './amountDecomposer';
import {
    type FeeRate,
    type MoneyRange,
    ScriptType,
    estimateInputVsize,
    estimateOutputVsize,
} from './money';

/**
 * Port of
 * `WalletWasabi.WabiSabiClientLibrary/Controllers/Helpers/GetOutputAmountsHelper.cs`,
 * i.e. the former `get-outputs-amounts` endpoint.
 *
 * The request keeps upstream's shape, including `InputSize` and `OutputSize`, which only
 * exist so that the helper can refuse anything but taproot.
 */
export interface GetOutputAmountsRequest {
    /** Effective input amounts registered by this participant. */
    InternalAmounts: number[];
    /** Effective input amounts registered by other participants. */
    ExternalAmounts: number[];
    /** Virtual size of an input. */
    InputSize: number;
    /** Virtual size of an output. */
    OutputSize: number;
    /** Available virtual size for outputs. */
    AvailableVsize: number;
    /** Mining fee rate in satoshis per 1000 virtual bytes. */
    MiningFeeRate: number;
    AllowedOutputAmounts: MoneyRange;
}

/** `GetOutputAmountsHelper.SupportedScriptTypes`. */
const SUPPORTED_SCRIPT_TYPES = [ScriptType.Taproot];

export const getOutputAmounts = (request: GetOutputAmountsRequest, random: Random): number[] => {
    if (request.InputSize !== estimateInputVsize(ScriptType.Taproot)) {
        throw new Error('Incorrect input size. Only taproot is supported.');
    }
    if (request.OutputSize !== estimateOutputVsize(ScriptType.Taproot)) {
        throw new Error('Incorrect output size. Only taproot is supported');
    }

    const feeRate: FeeRate = { feePerK: request.MiningFeeRate };
    const decomposer = new AmountDecomposer(
        feeRate,
        request.AllowedOutputAmounts.Min,
        request.AllowedOutputAmounts.Max,
        request.AvailableVsize,
        SUPPORTED_SCRIPT_TYPES,
        random,
    );

    return decomposer
        .decompose(request.InternalAmounts, request.ExternalAmounts)
        .map(output => output.amount);
};
