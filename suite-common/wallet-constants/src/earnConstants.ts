import { type VersionArray } from '@trezor/utils';

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

// Native balance kept aside when wrapping so the follow-up approve + deposit transactions
// still have enough to cover their fees — the same buffer staking keeps for its exit fee.
export const WETH_WRAP_GAS_RESERVE = MIN_ETH_BALANCE_FOR_FEE_BUFFER;

// WETH deposit() consumes ~45k gas; the generic ~250k contract-call backup would over-reserve
// the fee and could make a max-amount wrap fail.
export const WETH_DEPOSIT_BACKUP_GAS_LIMIT = '60000';
