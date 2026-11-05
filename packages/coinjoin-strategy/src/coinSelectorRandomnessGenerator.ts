import { type Random } from '@trezor/wabisabi-crypto';

import { orderBy } from './denominationBuilder';

/**
 * Port of `WalletWasabi/WabiSabi/Client/CoinJoinCoinSelectorRandomnessGenerator.cs`.
 *
 * Both methods are `virtual` upstream so that tests can stub them; the same two methods
 * are overridable here for the same reason.
 */
export class CoinJoinCoinSelectorRandomnessGenerator {
    readonly rnd: Random;

    private readonly maxInputsCount: number;
    /** Until our UTXO count target isn't reached, register as few coins as we can to reach it. */
    private readonly distance: { key: number; value: number }[] = [];

    constructor(maxInputsCount: number, rnd: Random) {
        this.rnd = rnd;
        this.maxInputsCount = maxInputsCount;

        for (let i = 1; i <= maxInputsCount; i++) {
            this.distance.push({ key: i, value: Math.abs(i - maxInputsCount) });
        }
    }

    getRandomBiasedSameTxAllowance(percent: number): number {
        for (let num = 0; num <= 100; num++) {
            if (this.rnd.getInt(1, 101) <= percent) {
                return num;
            }
        }

        return 0;
    }

    /**
     * Calculates how many inputs are desirable to be registered, with random biasing.
     *
     * Returns 1, 2, .., `MAX_INPUTS_REGISTRABLE_BY_WALLET`.
     */
    getInputTarget(): number {
        for (const best of orderBy(this.distance, x => x.value)) {
            if (this.rnd.getInt(0, 10) < 5) {
                return best.key;
            }
        }

        return this.maxInputsCount;
    }
}
