export type LidoEarnRowStatus =
    'hidden' | 'stake' | 'unstaking' | 'claim' | 'fund-claim' | 'withdrawals-unknown';

type GetLidoEarnRowStatusParams = {
    // The account holds wstETH.
    hasStake: boolean;
    // The account has ETH to stake or to pay a fee with.
    hasSpendableBalance: boolean;
    pendingRequestCount: number;
    claimableRequestCount: number;
    // Reading the withdrawal requests failed and no earlier read tells what they are.
    areWithdrawalsUnknown: boolean;
};

/**
 * What the Earn row of an account offers. An account whose whole stake waits in the withdrawal
 * queue holds neither wstETH nor, possibly, any ETH, and still has to reach its withdrawals. That
 * may be any account whose requests could not be read, so such an account keeps a row to retry on.
 */
export const getLidoEarnRowStatus = ({
    hasStake,
    hasSpendableBalance,
    pendingRequestCount,
    claimableRequestCount,
    areWithdrawalsUnknown,
}: GetLidoEarnRowStatusParams): LidoEarnRowStatus => {
    if (claimableRequestCount > 0) {
        return hasSpendableBalance ? 'claim' : 'fund-claim';
    }

    if (hasStake || hasSpendableBalance) {
        return 'stake';
    }

    if (pendingRequestCount > 0) {
        return 'unstaking';
    }

    return areWithdrawalsUnknown ? 'withdrawals-unknown' : 'hidden';
};
