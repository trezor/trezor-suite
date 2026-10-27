import {
    type FeeRate,
    type ScriptType,
    estimateInputVsize,
    estimateOutputVsize,
    getFee,
} from './money';

/**
 * Port of `WalletWasabi/WabiSabi/Client/Output.cs`.
 *
 * Upstream is a C# `record`, so it has structural equality and is used as a `HashSet`
 * and `Dictionary` key over all four of its fields. `key` below is that identity,
 * written out so it can be used in a JavaScript `Set`/`Map`.
 */
export class Output {
    readonly amount: number;
    readonly scriptType: ScriptType;
    readonly fee: number;
    readonly inputFee: number;

    private constructor(
        amount: number,
        scriptType: ScriptType,
        feeRate: FeeRate,
        isEffectiveCost: boolean,
    ) {
        this.scriptType = scriptType;
        this.fee = getFee(feeRate, estimateOutputVsize(scriptType));
        this.inputFee = getFee(feeRate, estimateInputVsize(scriptType));

        // The value of amount is defined as the effective cost or a denomination amount.
        this.amount = isEffectiveCost ? amount - this.fee : amount;
    }

    get effectiveAmount() {
        return this.amount - this.fee;
    }

    get effectiveCost() {
        return this.amount + this.fee;
    }

    /** The record's structural identity, for `Set` and `Map` keys. */
    get key() {
        return `${this.amount}:${this.scriptType}:${this.fee}:${this.inputFee}`;
    }

    equals(other: Output) {
        return this.key === other.key;
    }

    static fromDenomination(amount: number, scriptType: ScriptType, feeRate: FeeRate) {
        return new Output(amount, scriptType, feeRate, false);
    }

    static fromAmount(amount: number, scriptType: ScriptType, feeRate: FeeRate) {
        return new Output(amount, scriptType, feeRate, true);
    }
}
