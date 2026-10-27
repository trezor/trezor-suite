const decimalToFraction = (value: number) => {
    if (!Number.isFinite(value) || value < 0) {
        throw new Error(`A coordination fee rate must be a non-negative number, got ${value}.`);
    }
    // `toFixed` would lose precision for a rate written with many decimals, so take the
    // shortest decimal representation the number has, which is what a JSON rate came from.
    const text = value.toExponential();
    const [mantissa, exponentText] = text.split('e');
    const exponent = Number(exponentText);
    const [integerPart, fractionPart = ''] = (mantissa as string).split('.');
    const digits = `${integerPart}${fractionPart}`;
    const scale = fractionPart.length - exponent;

    return scale <= 0
        ? { numerator: BigInt(digits) * 10n ** BigInt(-scale), denominator: 1n }
        : { numerator: BigInt(digits), denominator: 10n ** BigInt(scale) };
};
/**
 * The `Money`, `FeeRate`, `CoordinationFeeRate` and `ScriptType` arithmetic the
 * decomposer and the coin selector need.
 *
 * Amounts are integer satoshis in a plain `number`. The largest value that reaches this
 * code is `Constants.MaximumNumberOfBitcoinsMoney` (2.1e15 satoshis), and real amounts
 * are bounded by `MaxAmountCredentialValue` (4.3e12); both are well inside
 * `Number.MAX_SAFE_INTEGER`. The one place that is not safe as floating point is the
 * coordination fee, which multiplies an amount by a decimal rate — that goes through
 * exact integer arithmetic below.
 */

/**
 * NBitcoin's `ScriptType` enum.
 *
 * The enum has no explicit values, so it is zero-based in declaration order, which is
 * the encoding the coordinator and upstream's test vectors use on the wire.
 */
export enum ScriptType {
    Witness = 0,
    P2PKH = 1,
    P2SH = 2,
    P2PK = 3,
    P2WPKH = 4,
    P2WSH = 5,
    MultiSig = 6,
    Taproot = 7,
}

/** The script type names the coordinator sends in round parameters. */
export type ScriptTypeName = 'P2WPKH' | 'Taproot';

/**
 * Accepts either encoding, as the binary's Newtonsoft deserializer did: Suite sends the
 * names, upstream's committed vectors use the numbers.
 */
export const parseScriptType = (value: ScriptType | ScriptTypeName | number): ScriptType => {
    if (typeof value === 'string') {
        const parsed = ScriptType[value as keyof typeof ScriptType];
        if (parsed === undefined) {
            throw new Error(`Unknown script type: ${value}.`);
        }

        return parsed;
    }
    if (ScriptType[value] === undefined) {
        throw new Error(`Unknown script type: ${value}.`);
    }

    return value;
};

/**
 * Virtual sizes from `WalletWasabi/Helpers/Constants.cs`.
 *
 * `EstimateInputVsize` / `EstimateOutputVsize` throw for anything else, which is how
 * `GetOutputAmountsHelper` enforces that only taproot is supported.
 */
const P2WPKH_INPUT_VSIZE = 69;
const P2WPKH_OUTPUT_VSIZE = 31;
const P2TR_INPUT_VSIZE = 58;
const P2TR_OUTPUT_VSIZE = 43;

export const estimateInputVsize = (scriptType: ScriptType) => {
    switch (scriptType) {
        case ScriptType.P2WPKH:
            return P2WPKH_INPUT_VSIZE;
        case ScriptType.Taproot:
            return P2TR_INPUT_VSIZE;
        default:
            throw new Error("Size estimation isn't implemented for provided script type.");
    }
};

export const estimateOutputVsize = (scriptType: ScriptType) => {
    switch (scriptType) {
        case ScriptType.P2WPKH:
            return P2WPKH_OUTPUT_VSIZE;
        case ScriptType.Taproot:
            return P2TR_OUTPUT_VSIZE;
        default:
            throw new Error("Size estimation isn't implemented for provided script type.");
    }
};

/** `Constants.MaximumNumberOfBitcoinsMoney` — `Money.Coins(20999999.9769m)`. */
export const MAXIMUM_NUMBER_OF_BITCOINS_MONEY = 2_099_999_976_900_000;

/** `ProtocolConstants.MaxAmountPerAlice`. */
export const MAX_AMOUNT_PER_ALICE = 4_300_000_000_000;

/** `Constants.SemiPrivateThreshold`. */
export const SEMI_PRIVATE_THRESHOLD = 2;

/** `NBitcoin.FeeRate`, carried as its fee per 1000 virtual bytes. */
export interface FeeRate {
    /** `FeeRate.FeePerK.Satoshi`. */
    feePerK: number;
}

/** `new FeeRate(Money feePerK)` — the encoding the coordinator uses. */
export const feeRateFromSatoshiPerKvByte = (feePerK: number): FeeRate => {
    if (feePerK < 0) {
        throw new Error('A fee rate cannot be less than 0.');
    }

    return { feePerK };
};

/** `new FeeRate(decimal satoshiPerByte)`. */
export const feeRateFromSatoshiPerVByte = (satoshiPerByte: number): FeeRate =>
    feeRateFromSatoshiPerKvByte(Math.trunc(satoshiPerByte * 1000));

/**
 * `FeeRate.GetFee(int virtualSize)`.
 *
 * Two upstream quirks, both load-bearing:
 *   - the division truncates, because `_FeePerK.Satoshi * virtualSize / 1000` is `long`
 *     arithmetic in C#;
 *   - a truncated fee of zero becomes **one satoshi**, unconditionally — including when
 *     the fee rate itself is zero. `AmountDecomposerTests` runs with a zero fee rate and
 *     still expects one satoshi per output.
 */
export const getFee = (feeRate: FeeRate, virtualSize: number) => {
    const fee = Math.trunc((feeRate.feePerK * virtualSize) / 1000);

    return fee === 0 ? 1 : fee;
};

/** `WalletWasabi.WabiSabi.Models.MoneyRange`. */
export interface MoneyRange {
    Min: number;
    Max: number;
}

export const moneyRangeContains = (range: MoneyRange, value: number) =>
    value >= range.Min && value <= range.Max;

/** `WalletWasabi.WabiSabi.Models.CoordinationFeeRate`. */
export interface CoordinationFeeRate {
    Rate: number;
    PlebsDontPayThreshold: number;
}

export const COORDINATION_FEE_RATE_ZERO: CoordinationFeeRate = {
    Rate: 0,
    PlebsDontPayThreshold: 0,
};

/**
 * `CoordinationFeeRate.GetFee(Money amount)` — `floor(amount * Rate)`.
 *
 * Upstream multiplies a `long` by a C# `decimal`, which is exact. Doing the same in
 * floating point can land just under an integer and floor one satoshi low, so the rate
 * is turned back into the fraction its decimal representation denotes and the product is
 * taken in `BigInt`.
 */
export const getCoordinationFee = (
    coordinationFeeRate: CoordinationFeeRate,
    amount: number,
): number => {
    if (amount <= coordinationFeeRate.PlebsDontPayThreshold) {
        return 0;
    }
    const { numerator, denominator } = decimalToFraction(coordinationFeeRate.Rate);

    return Number((BigInt(amount) * numerator) / denominator);
};

/** `NBitcoinExtensions.EffectiveValue(amount, virtualSize, feeRate, coordinationFeeRate)`. */
export const effectiveValue = (
    amount: number,
    scriptType: ScriptType,
    feeRate: FeeRate,
    coordinationFeeRate: CoordinationFeeRate = COORDINATION_FEE_RATE_ZERO,
) =>
    amount -
    getFee(feeRate, estimateInputVsize(scriptType)) -
    getCoordinationFee(coordinationFeeRate, amount);

/**
 * `Script.GetScriptType()` for the types a coinjoin round can allow.
 *
 * Returns `undefined` for anything else, which makes the allowed-input-types check in
 * the coin selector reject it — upstream gets the same outcome by returning a script
 * type that is not in the allowed set.
 */
export const getScriptTypeFromScriptPubKey = (scriptPubKeyHex: string): ScriptType | undefined => {
    const hex = scriptPubKeyHex.toLowerCase();
    if (/^0014[0-9a-f]{40}$/.test(hex)) {
        return ScriptType.P2WPKH;
    }
    if (/^0020[0-9a-f]{64}$/.test(hex)) {
        return ScriptType.P2WSH;
    }
    if (/^5120[0-9a-f]{64}$/.test(hex)) {
        return ScriptType.Taproot;
    }
    if (/^76a914[0-9a-f]{40}88ac$/.test(hex)) {
        return ScriptType.P2PKH;
    }
    if (/^a914[0-9a-f]{40}87$/.test(hex)) {
        return ScriptType.P2SH;
    }
    if (/^(21[0-9a-f]{66}|41[0-9a-f]{130})ac$/.test(hex)) {
        return ScriptType.P2PK;
    }

    return undefined;
};
