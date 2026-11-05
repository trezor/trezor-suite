import { type Random } from '@trezor/wabisabi-crypto';

import {
    type UtxoSelectionParameters,
    calculateSmallestReasonableEffectiveDenomination,
} from './coinSelector';
import {
    type CoordinationFeeRate,
    type FeeRate,
    type MoneyRange,
    type ScriptType,
    estimateInputVsize,
    estimateOutputVsize,
    getFee,
} from './money';

/**
 * The parts of `WalletWasabi/WabiSabi/Backend/Rounds/RoundParameters.cs` that the client
 * side needs.
 *
 * `select-inputs-for-round` itself goes through the static
 * `calculateSmallestReasonableEffectiveDenomination` with the round's minimum allowed
 * output amount; these are the instance equivalents, which take the economically
 * reasonable minimum into account and are what upstream's own client tests drive.
 */
export interface RoundParametersLike {
    miningFeeRate: FeeRate;
    coordinationFeeRate: CoordinationFeeRate;
    allowedInputAmounts: MoneyRange;
    allowedOutputAmounts: MoneyRange;
    allowedInputTypes: readonly ScriptType[];
    allowedOutputTypes: readonly ScriptType[];
}

/** `RoundParameters.MaxVsizeInputOutputPair`. */
export const maxVsizeInputOutputPair = (allowedOutputTypes: readonly ScriptType[]) =>
    Math.max(
        ...allowedOutputTypes.map(type => estimateInputVsize(type) + estimateOutputVsize(type)),
    );

/**
 * `RoundParameters.MaxVsizeInputOutputPairScriptType`.
 *
 * `MaxBy` returns the *last* maximal element in LINQ, so a tie goes to the later script
 * type in the allowed set.
 */
export const maxVsizeInputOutputPairScriptType = (
    allowedOutputTypes: readonly ScriptType[],
): ScriptType => {
    let best = allowedOutputTypes[0] as ScriptType;
    let bestVsize = -1;
    allowedOutputTypes.forEach(type => {
        const vsize = estimateInputVsize(type) + estimateOutputVsize(type);
        if (vsize >= bestVsize) {
            best = type;
            bestVsize = vsize;
        }
    });

    return best;
};

/**
 * `RoundParameters.CalculateMinReasonableOutputAmount`.
 *
 * Min output amount that's economically reasonable to register under current network
 * conditions; never smaller than the min allowed output amount.
 */
export const calculateMinReasonableOutputAmount = (parameters: RoundParametersLike) => {
    const minEconomicalOutput = getFee(
        parameters.miningFeeRate,
        maxVsizeInputOutputPair(parameters.allowedOutputTypes),
    );

    return Math.max(minEconomicalOutput, parameters.allowedOutputAmounts.Min);
};

/** `RoundParameters.CalculateSmallestReasonableEffectiveDenomination()`, the instance overload. */
export const calculateRoundSmallestReasonableEffectiveDenomination = (
    parameters: RoundParametersLike,
    random: Random,
) =>
    calculateSmallestReasonableEffectiveDenomination(
        calculateMinReasonableOutputAmount(parameters),
        parameters.allowedOutputAmounts.Max,
        parameters.miningFeeRate,
        maxVsizeInputOutputPairScriptType(parameters.allowedOutputTypes),
        random,
    );

/** `UtxoSelectionParameters.FromRoundParameters`. */
export const utxoSelectionParametersFromRoundParameters = (
    parameters: RoundParametersLike,
    random: Random,
): UtxoSelectionParameters => ({
    allowedInputAmounts: parameters.allowedInputAmounts,
    allowedOutputAmounts: {
        Min: calculateRoundSmallestReasonableEffectiveDenomination(parameters, random),
        Max: parameters.allowedOutputAmounts.Max,
    },
    coordinationFeeRate: parameters.coordinationFeeRate,
    miningFeeRate: parameters.miningFeeRate,
    allowedInputScriptTypes: parameters.allowedInputTypes,
});
