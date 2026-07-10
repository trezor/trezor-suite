import { BigNumber } from '@trezor/utils';

// Native balance kept aside when wrapping so the wrap + approve + deposit fees
// stay covered (~200k gas total, with headroom for fee spikes). Caps both the
// Max suggestion and the wrap amount validation.
export const WETH_WRAP_GAS_RESERVE = new BigNumber(0.001);

// WETH deposit() consumes ~45k gas; the generic contract-call backup of 250k
// would over-reserve the fee and could make a max-amount wrap fail.
export const WETH_DEPOSIT_BACKUP_GAS_LIMIT = '60000';
