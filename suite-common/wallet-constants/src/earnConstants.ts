import { MIN_ETH_BALANCE_FOR_FEE_BUFFER } from './ethereumStakingConstants';

// Native balance kept aside when wrapping so the follow-up approve + deposit transactions
// still have enough to cover their fees — the same buffer staking keeps for its exit fee.
export const WETH_WRAP_GAS_RESERVE = MIN_ETH_BALANCE_FOR_FEE_BUFFER;

// WETH deposit() consumes ~45k gas; the generic ~250k contract-call backup would over-reserve
// the fee and could make a max-amount wrap fail.
export const WETH_DEPOSIT_BACKUP_GAS_LIMIT = '60000';
