import { BigNumber } from '@trezor/utils';

import { type EstimateFeeLevel } from './types';

/**
 * Precomposed fee fields shared by Tron contract-call transactions (TRC20 transfers and
 * raw contract calls).
 *
 * All SUN-denominated values derive from `feePerTx`, NOT from `feeLevel.feeLimit` (which is
 * an energy-unit count). `feeLimit` is the SUN `fee_limit` cap copied verbatim into the
 * signed tx; it equals the energy fee estimate (`feePerTx`). On-chain `fee_limit` caps the
 * energy burn only, so memo and bandwidth costs are excluded here.
 *
 * `fee` and `feeLimit` are returned from a single SUN value so they can never drift in unit;
 * using `feeLevel.feeLimit` for the cap is the bug this guards against (caused OUT_OF_ENERGY
 * on TRC20 trades by capping ~`feePerUnit`x too low).
 */
export const getContractCallFeeFields = (feeLevel: EstimateFeeLevel) => {
    const feeInSun = feeLevel.feePerTx || '0';
    const energyConsumed =
        feeLevel.feePerTx && feeLevel.feePerUnit && !new BigNumber(feeLevel.feePerUnit).isZero()
            ? new BigNumber(feeLevel.feePerTx).dividedToIntegerBy(feeLevel.feePerUnit).toNumber()
            : 0;

    return {
        fee: feeInSun,
        feeLimit: feeInSun,
        feePerByte: feeLevel.feePerUnit,
        energyConsumed,
    };
};
