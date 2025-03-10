import { Account, WalletAccountTransaction } from '@suite-common/wallet-types';
import {
    getStakingDataForNetwork,
    isPending,
    isSupportedStakingNetworkSymbol,
} from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

export const isAccountStakingActive = (
    account: Account | null,
    claimTransactions: WalletAccountTransaction[],
) => {
    if (!account) return false;

    if (!isSupportedStakingNetworkSymbol(account.symbol)) return false;

    const {
        totalPendingStakeBalance = '0',
        withdrawTotalAmount = '0',
        claimableAmount = '0',
        canClaim = false,
        depositedBalance = '0',
    } = getStakingDataForNetwork(account) ?? {};

    const pendingClaimTxs = claimTransactions.filter(tx => isPending(tx));

    const isStakePending = new BigNumber(totalPendingStakeBalance).gt(0);
    const isUnstakePending = new BigNumber(withdrawTotalAmount).gt(0);
    const isClaimPending = new BigNumber(claimableAmount).gt(0) && pendingClaimTxs.length > 0;
    const hasDepositedBalance = new BigNumber(depositedBalance).gt(0);

    return hasDepositedBalance || isStakePending || isUnstakePending || isClaimPending || canClaim;
};
