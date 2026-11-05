import { type Random } from '@trezor/wabisabi-crypto';

import {
    CoinJoinCoinSelector,
    MAX_INPUTS_REGISTRABLE_BY_WALLET,
    type SmartCoin,
    type UtxoSelectionParameters,
    calculateSmallestReasonableEffectiveDenomination,
} from './coinSelector';
import { CoinJoinCoinSelectorRandomnessGenerator } from './coinSelectorRandomnessGenerator';
import {
    type CoordinationFeeRate,
    type MoneyRange,
    ScriptType,
    type ScriptTypeName,
    getScriptTypeFromScriptPubKey,
    parseScriptType,
} from './money';

/**
 * `OutPoint.Hash` — the txid of a serialized outpoint.
 *
 * Only used to tell coins from the same transaction apart, so the hex is compared as it
 * comes, without reversing the byte order.
 */
const transactionIdOf = (outpoint: string) => outpoint.slice(0, 64);

/** `OutPoint.N` — the little-endian output index of a serialized outpoint. */
const outpointIndexOf = (outpoint: string) => {
    const hex = outpoint.slice(64, 72);
    if (hex.length !== 8) {
        return 0;
    }

    return (
        Number.parseInt(hex.slice(0, 2), 16) |
        (Number.parseInt(hex.slice(2, 4), 16) << 8) |
        (Number.parseInt(hex.slice(4, 6), 16) << 16) |
        (Number.parseInt(hex.slice(6, 8), 16) << 24)
    );
};

/** `WalletWasabi.WabiSabiClientLibrary/Models/SelectInputsForRound/Utxo.cs`. */
export interface UtxoForRound {
    /** The outpoint identifying the UTXO: 32-byte txid, little endian, plus a 4-byte index. */
    Outpoint: string;
    /** Value of the UTXO in satoshis (not the effective value). */
    Amount: number;
    /** The raw scriptPubKey hex. */
    ScriptPubKey: string;
    /** Anonymity set assigned to the UTXO. */
    AnonymitySet: number;
}

/**
 * Port of
 * `WalletWasabi.WabiSabiClientLibrary/Models/SelectInputsForRoundRequest.cs`.
 *
 * The shape is upstream's, including `DoNotSelectPrivateCoins`, which Suite never sends,
 * so that the committed vectors exercise it.
 */
export interface SelectInputsForRoundRequest {
    AllowedInputAmounts: MoneyRange;
    AllowedOutputAmounts: MoneyRange;
    CoordinationFeeRate: CoordinationFeeRate;
    /** Mining fee rate in satoshis per 1000 virtual bytes. */
    MiningFeeRate: number;
    AllowedInputTypes: (ScriptType | ScriptTypeName | number)[];
    Utxos: UtxoForRound[];
    AnonScoreTarget: number;
    SemiPrivateThreshold: number;
    LiquidityClue: number;
    ConsolidationMode?: boolean;
    DoNotSelectPrivateCoins?: boolean;
}

/**
 * Port of
 * `WalletWasabi.WabiSabiClientLibrary/Controllers/Helpers/SelectInputsForRoundHelper.cs`,
 * i.e. the former `select-inputs-for-round` endpoint.
 *
 * Returns the ascending indices into `request.Utxos` of the selected UTXOs.
 */
export const selectInputsForRound = (
    request: SelectInputsForRoundRequest,
    random: Random,
): number[] => {
    const miningFeeRate = { feePerK: request.MiningFeeRate };
    const reasonableOutputAmountRange: MoneyRange = {
        Min: calculateSmallestReasonableEffectiveDenomination(
            request.AllowedOutputAmounts.Min,
            request.AllowedOutputAmounts.Max,
            miningFeeRate,
            ScriptType.Taproot,
            random,
        ),
        Max: request.AllowedOutputAmounts.Max,
    };

    const utxoSelectionParameters: UtxoSelectionParameters = {
        allowedInputAmounts: request.AllowedInputAmounts,
        allowedOutputAmounts: reasonableOutputAmountRange,
        coordinationFeeRate: request.CoordinationFeeRate,
        miningFeeRate,
        // `.ToImmutableSortedSet()` — sorted and de-duplicated.
        allowedInputScriptTypes: [...new Set(request.AllowedInputTypes.map(parseScriptType))].sort(
            (a, b) => a - b,
        ),
    };

    const randomnessGenerator = new CoinJoinCoinSelectorRandomnessGenerator(
        MAX_INPUTS_REGISTRABLE_BY_WALLET,
        random,
    );

    const coins: IndexedCoin[] = request.Utxos.map((utxo, index) => ({
        amount: utxo.Amount,
        scriptType: getScriptTypeFromScriptPubKey(utxo.ScriptPubKey),
        scriptPubKey: utxo.ScriptPubKey,
        anonymitySet: utxo.AnonymitySet,
        transactionId: transactionIdOf(utxo.Outpoint),
        index: outpointIndexOf(utxo.Outpoint),
        utxoIndex: index,
    }));

    const candidates = request.DoNotSelectPrivateCoins
        ? coins.filter(x => x.anonymitySet < request.AnonScoreTarget)
        : coins;

    const selector = new CoinJoinCoinSelector(
        request.ConsolidationMode ?? false,
        request.AnonScoreTarget,
        request.SemiPrivateThreshold,
        randomnessGenerator,
    );

    return selector
        .selectCoinsForRound(candidates, utxoSelectionParameters, request.LiquidityClue)
        .map(coin => coin.utxoIndex)
        .sort((a, b) => a - b);
};

interface IndexedCoin extends SmartCoin {
    utxoIndex: number;
}
