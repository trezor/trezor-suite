import type { StakingOperation } from '@suite-common/earn-staking-common';
import type { EarnTransactionFlow } from '@suite-common/wallet-core';

const EARN_TRANSACTION_FLOWS: Record<StakingOperation, EarnTransactionFlow> = {
    stake: 'stake',
    unstake: 'unstake',
    withdraw: 'withdraw',
    claim: 'claim',
    vote: 'vote',
    redelegate: 'vote',
};

export const getEarnTransactionFlow = (operation: StakingOperation): EarnTransactionFlow =>
    EARN_TRANSACTION_FLOWS[operation];
