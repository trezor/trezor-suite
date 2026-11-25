import { type StakingOperation } from '@suite-common/earn-staking-common';

// StakeETH on the wstETH referral staker, requestWithdrawalsWstETH and claimWithdrawals on the
// withdrawal queue.
export const ETHEREUM_LIDO_OPERATIONS_BY_METHOD_ID: Partial<Record<string, StakingOperation>> = {
    '0x946fe3e8': 'stake',
    '0x19aa6257': 'unstake',
    '0xe3afe0a3': 'withdraw',
};
