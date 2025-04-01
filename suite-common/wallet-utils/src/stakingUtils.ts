import { NetworkSymbol, NetworkType } from '@suite-common/wallet-config';
import {
    MAX_ETH_AMOUNT_FOR_STAKING,
    MAX_SOL_AMOUNT_FOR_STAKING,
    MIN_ETH_AMOUNT_FOR_STAKING,
    MIN_ETH_BALANCE_FOR_STAKING,
    MIN_ETH_FOR_WITHDRAWALS,
    MIN_SOL_AMOUNT_FOR_STAKING,
    MIN_SOL_BALANCE_FOR_STAKING,
    MIN_SOL_FOR_WITHDRAWALS,
    SOLANA_EPOCH_DAYS,
    UNSTAKING_ETH_PERIOD,
} from '@suite-common/wallet-constants';
import { Account, PrecomposedLevels, StakingPoolExtended } from '@suite-common/wallet-types';
import { BigNumber } from '@trezor/utils';

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

export const secondsToDays = (seconds: number) => Math.round(seconds / 60 / 60 / 24);

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

interface GetUnstakingPeriodInDays {
    networkType?: NetworkType;
    validatorWithdrawTime?: number; // in seconds
    validatorExitTime?: number; // in seconds
}

export const getUnstakingPeriodInDays = ({
    networkType,
    validatorWithdrawTime,
    validatorExitTime,
}: GetUnstakingPeriodInDays) => {
    if (networkType === 'solana') {
        return SOLANA_EPOCH_DAYS;
    }

    if (validatorWithdrawTime === undefined || validatorExitTime === undefined) {
        return UNSTAKING_ETH_PERIOD;
    }

    const unstakingPeriodInSeconds = new BigNumber(validatorWithdrawTime)
        .plus(validatorExitTime)
        .toNumber();

    return secondsToDays(unstakingPeriodInSeconds);
};

export const getOutputTxAmount = (composedLevels?: PrecomposedLevels) => {
    if (!composedLevels) return null;

    const precomposedTx = composedLevels['normal'];
    if (precomposedTx?.type !== 'final') return null;

    return precomposedTx.outputs[0].amount;
};
