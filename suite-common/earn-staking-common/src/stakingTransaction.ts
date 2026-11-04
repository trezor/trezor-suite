import type { AccountTransaction } from '@trezor/connect-common';

export type StakingTransaction = Pick<
    AccountTransaction,
    | 'txid'
    | 'type'
    | 'blockHeight'
    | 'blockTime'
    | 'ethereumSpecific'
    | 'solanaSpecific'
    | 'cardanoSpecific'
    | 'tronSpecific'
>;

export const isPendingStakingTransaction = ({
    blockHeight,
    solanaSpecific,
}: StakingTransaction): boolean => {
    if (solanaSpecific?.status === 'confirmed') return false;

    return !blockHeight || blockHeight < 0;
};
