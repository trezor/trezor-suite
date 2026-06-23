import { BigNumber } from '@trezor/utils';

import { type EstimateFeeLevel } from './types';

/**
 * Headroom applied to the contract-call `fee_limit` cap over the node's energy estimate.
 *
 * The estimate comes from `triggerconstantcontract`, which returns *base* energy and does
 * NOT apply Tron's dynamic energy model: at execution each op's cost is multiplied by the
 * contract's current `energy_factor` (surfaced on-chain as `penaltyEnergy`). For high-traffic
 * contracts like USDT this factor is large, so the bare estimate is structurally too low and
 * the tx fails with OUT_OF_ENERGY even when the cap is in the correct unit (SUN).
 *
 * The dominant case is a TRC20 transfer to a recipient with zero token balance: writing a
 * fresh storage slot (SSTORE from zero) roughly doubles the energy vs a "warm" recipient
 * (~64.3k -> ~130.3k energy for USDT, ~2.03x), which the estimate undershoots. An exact 2x
 * lands just below that (observed on-chain: cap 128,570 vs ~129,610 needed -> Out of Energy),
 * so 2.2x is used to clear the cold-recipient cost (~141k energy) with a small buffer. A flat
 * multiplier is a heuristic; the cap only bounds the *maximum* burn (the user is charged actual
 * energy used), so extra headroom is cheap relative to a failed tx (energy burned, no transfer).
 */
export const TRON_ENERGY_FEE_LIMIT_MARGIN = 2.2;

/**
 * Precomposed fee fields shared by Tron contract-call transactions (TRC20 transfers and
 * raw contract calls).
 *
 * All SUN-denominated values derive from `feePerTx`, NOT from `feeLevel.feeLimit` (which is
 * an energy-unit count). `fee` is the bare energy estimate in SUN (what we display / expect
 * to be charged). `feeLimit` is the SUN `fee_limit` cap copied verbatim into the signed tx:
 * `fee` plus dynamic-energy headroom. On-chain `fee_limit` caps the energy burn only, so memo
 * and bandwidth costs are excluded, and it is a ceiling (the user is charged actual energy
 * used) so it can safely exceed the account balance.
 *
 * Both `fee` and `feeLimit` derive from one SUN value, so they can never drift in unit;
 * using `feeLevel.feeLimit` for the cap is the original bug this guards against.
 */
export const getContractCallFeeFields = (feeLevel: EstimateFeeLevel) => {
    const feeInSun = feeLevel.feePerTx || '0';
    const feeLimitInSun = new BigNumber(feeInSun)
        .multipliedBy(TRON_ENERGY_FEE_LIMIT_MARGIN)
        .integerValue(BigNumber.ROUND_CEIL)
        .toString();
    const energyConsumed =
        feeLevel.feePerTx && feeLevel.feePerUnit && !new BigNumber(feeLevel.feePerUnit).isZero()
            ? new BigNumber(feeLevel.feePerTx).dividedToIntegerBy(feeLevel.feePerUnit).toNumber()
            : 0;

    return {
        fee: feeInSun,
        feeLimit: feeLimitInSun,
        feePerByte: feeLevel.feePerUnit,
        energyConsumed,
    };
};
