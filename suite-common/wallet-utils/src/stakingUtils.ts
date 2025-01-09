import { Account, StakingPoolExtended } from '@suite-common/wallet-types';
import { NetworkSymbol } from '@suite-common/wallet-config';
import {
    MAX_ETH_AMOUNT_FOR_STAKING,
    MAX_SOL_AMOUNT_FOR_STAKING,
    MIN_ETH_AMOUNT_FOR_STAKING,
    MIN_ETH_BALANCE_FOR_STAKING,
    MIN_ETH_FOR_WITHDRAWALS,
    MIN_SOL_AMOUNT_FOR_STAKING,
    MIN_SOL_BALANCE_FOR_STAKING,
    MIN_SOL_FOR_WITHDRAWALS,
} from '@suite-common/wallet-constants';

import {
    getAccountEverstakeStakingPool,
    getEthAccountTotalStakingBalance,
    isSupportedEthStakingNetworkSymbol,
} from './ethereumStakingUtils';
import {
    getSolAccountTotalStakingBalance,
    getSolStakingAccountsInfo,
    isSupportedSolStakingNetworkSymbol,
} from './solanaStakingUtils';

export const getAccountTotalStakingBalance = (account: Account) => {
    if (!account) return null;

    switch (account.networkType) {
        case 'ethereum':
            return getEthAccountTotalStakingBalance(account);
        case 'solana':
            return getSolAccountTotalStakingBalance(account);
        default:
            return null;
    }
};

export const isSupportedStakingNetworkSymbol = (symbol: NetworkSymbol) =>
    isSupportedEthStakingNetworkSymbol(symbol) || isSupportedSolStakingNetworkSymbol(symbol);

export const getStakingLimitsByNetwork = (account: Account) => {
    switch (account.networkType) {
        case 'ethereum':
            return {
                MIN_AMOUNT_FOR_STAKING: MIN_ETH_AMOUNT_FOR_STAKING,
                MAX_AMOUNT_FOR_STAKING: MAX_ETH_AMOUNT_FOR_STAKING,
                MIN_FOR_WITHDRAWALS: MIN_ETH_FOR_WITHDRAWALS,
                MIN_BALANCE_FOR_STAKING: MIN_ETH_BALANCE_FOR_STAKING,
            };
        case 'solana':
            return {
                MIN_AMOUNT_FOR_STAKING: MIN_SOL_AMOUNT_FOR_STAKING,
                MAX_AMOUNT_FOR_STAKING: MAX_SOL_AMOUNT_FOR_STAKING,
                MIN_FOR_WITHDRAWALS: MIN_SOL_FOR_WITHDRAWALS,
                MIN_BALANCE_FOR_STAKING: MIN_SOL_BALANCE_FOR_STAKING,
            };
        default:
            throw new Error(`Unsupported network type: ${account.networkType}`);
    }
};

export const getStakingDataForNetwork = (
    account?: Account,
): Omit<StakingPoolExtended, 'contract' | 'name'> | undefined => {
    if (!account) return;

    switch (account.networkType) {
        case 'ethereum':
            return getAccountEverstakeStakingPool(account);
        case 'solana': {
            const {
                canClaimSol,
                solClaimableBalance,
                solStakedBalance,
                solPendingStakeBalance,
                solPendingUnstakeBalance,
            } = getSolStakingAccountsInfo(account) ?? {};

            return {
                autocompoundBalance: solStakedBalance,
                claimableAmount: solClaimableBalance,
                depositedBalance: solStakedBalance,
                pendingBalance: '',
                pendingDepositedBalance: '',
                totalPendingStakeBalance: solPendingStakeBalance,
                restakedReward: '',
                withdrawTotalAmount: solPendingUnstakeBalance,
                canClaim: canClaimSol,
            };
        }
        default:
            return;
    }
};
