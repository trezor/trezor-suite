import { BigNumber, type VersionArray } from '@trezor/utils';

import { MIN_ETH_BALANCE_FOR_FEE_BUFFER } from './ethereumConstants';

/**
 * Wrap/unwrap and the wrapped-native (WETH) vault calldata are clear-signed only from this
 * firmware; older versions would show a raw function signature (trezor/trezor-suite#30848).
 *
 * Note this is stricter than the `evmClearSigning` capability, which connect reports from 2.12.1 —
 * a device on 2.12.1–2.12.3 advertises clear signing but still blind-signs WETH. Anything deciding
 * how a wrap/unwrap is presented has to gate on this version, not on the capability alone.
 */
export const WRAPPED_NATIVE_MIN_FIRMWARE: VersionArray = [2, 12, 4];

// Native balance kept aside for the yield flow's follow-up fees when no fee estimate is available
// to derive the dynamic reserve from (trezor/trezor-suite#31192).
export const YIELD_GAS_RESERVE_FALLBACK = MIN_ETH_BALANCE_FOR_FEE_BUFFER;

// WETH deposit() consumes ~45k gas; the generic ~250k contract-call backup would over-reserve
// the fee and could make a max-amount wrap fail.
export const WETH_DEPOSIT_BACKUP_GAS_LIMIT = '60000';

// Gas consumed by each transaction of the yield lifecycle, used to size the native-coin reserve
// a deposit keeps aside for its follow-up fees. The vault figures come from mainnet transactions
// of the Trezor Steakhouse Prime vaults (deposit/withdraw/redeem all land between 410k and 600k).
export const YIELD_GAS_LIMIT_WRAP = 50_000;
export const YIELD_GAS_LIMIT_APPROVE = 55_000;
export const YIELD_GAS_LIMIT_VAULT_DEPOSIT = 600_000;
export const YIELD_GAS_LIMIT_VAULT_WITHDRAW = 600_000;
export const YIELD_GAS_LIMIT_UNWRAP = 35_000;

// The entry transactions are paid at roughly the current fee; the exit ones (withdraw, unwrap)
// happen weeks or months later at an unknown fee, so they carry a larger margin.
export const YIELD_GAS_RESERVE_ENTRY_MULTIPLIER = 1.25;
export const YIELD_GAS_RESERVE_EXIT_MULTIPLIER = 2.5;

// Bounds against fee-oracle outliers, in native coin units.
export const YIELD_GAS_RESERVE_FLOOR = new BigNumber(0.0005);
export const YIELD_GAS_RESERVE_CAP = new BigNumber(0.2);
