import { NetworkSymbol, NetworkType } from '@suite-common/wallet-config';
import {
    CARDANO_EPOCH_DAYS,
    MAX_CARDANO_AMOUNT_FOR_STAKING,
    MAX_ETH_AMOUNT_FOR_STAKING,
    MAX_SOL_AMOUNT_FOR_STAKING,
    MIN_CARDANO_AMOUNT_FOR_STAKING,
    MIN_CARDANO_BALANCE_FOR_STAKING,
    MIN_CARDANO_FOR_WITHDRAWALS,
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

import { asAmountSubunit } from './AmountTypes';
import { subunitsToUnits } from './amountUtils';
import { isSupportedAdaStakingNetworkSymbol } from './cardanoStakingUtils';
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
    switch (account?.networkType) {
        case 'ethereum':
            return getEthAccountTotalStakingBalance(account);
        case 'solana':
            return getSolAccountTotalStakingBalance(account);
        default:
            return null;
    }
};

export const isSupportedStakingNetworkSymbol = (symbol: NetworkSymbol) =>
    isSupportedEthStakingNetworkSymbol(symbol) ||
    isSupportedSolStakingNetworkSymbol(symbol) ||
    isSupportedAdaStakingNetworkSymbol(symbol);

export type StakingLimits = {
    MIN_AMOUNT_FOR_STAKING: BigNumber;
    MAX_AMOUNT_FOR_STAKING: BigNumber;
    MIN_FOR_WITHDRAWALS: BigNumber;
    MIN_BALANCE_FOR_STAKING: BigNumber;
};

export const getStakingLimitsByNetworkSymbol = (
    symbol: NetworkSymbol | undefined,
): StakingLimits | null => {
    switch (symbol) {
        case 'tsep':
        case 'thod':
        case 'eth':
            return {
                MIN_AMOUNT_FOR_STAKING: MIN_ETH_AMOUNT_FOR_STAKING,
                MAX_AMOUNT_FOR_STAKING: MAX_ETH_AMOUNT_FOR_STAKING,
                MIN_FOR_WITHDRAWALS: MIN_ETH_FOR_WITHDRAWALS,
                MIN_BALANCE_FOR_STAKING: MIN_ETH_BALANCE_FOR_STAKING,
            };

        case 'dsol':
        case 'sol':
            return {
                MIN_AMOUNT_FOR_STAKING: MIN_SOL_AMOUNT_FOR_STAKING,
                MAX_AMOUNT_FOR_STAKING: MAX_SOL_AMOUNT_FOR_STAKING,
                MIN_FOR_WITHDRAWALS: MIN_SOL_FOR_WITHDRAWALS,
                MIN_BALANCE_FOR_STAKING: MIN_SOL_BALANCE_FOR_STAKING,
            };

        case 'tada':
        case 'ada':
            return {
                MIN_AMOUNT_FOR_STAKING: MIN_CARDANO_AMOUNT_FOR_STAKING,
                MAX_AMOUNT_FOR_STAKING: MAX_CARDANO_AMOUNT_FOR_STAKING,
                MIN_FOR_WITHDRAWALS: MIN_CARDANO_FOR_WITHDRAWALS,
                MIN_BALANCE_FOR_STAKING: MIN_CARDANO_BALANCE_FOR_STAKING,
            };

        default:
            return null;
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

        case 'cardano': {
            const { isActive, rewards } = account.misc.staking;
            const totalStakedBalance = isActive ? account.formattedBalance : '';

            const formattedRewards = subunitsToUnits({
                value: asAmountSubunit(new BigNumber(rewards)),
                symbol: account.symbol,
            }).toString();

            const hasRewards = new BigNumber(rewards).isGreaterThan(0);
            const totalPendingStakeBalance = !hasRewards ? account.formattedBalance : '';

            return {
                autocompoundBalance: totalStakedBalance,
                claimableAmount: '',
                depositedBalance: hasRewards ? totalStakedBalance : '',
                pendingBalance: '',
                pendingDepositedBalance: '',
                totalPendingStakeBalance,
                restakedReward: formattedRewards,
                withdrawTotalAmount: '',
                canClaim: false,
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

    if (networkType === 'cardano') {
        return CARDANO_EPOCH_DAYS;
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

export const calculateYearlyRewards = (amount: string, apyPercent: number, days = 365) => {
    const apy = apyPercent / 100;
    const factor = Math.pow(1 + apy, days / 365) - 1;
    const currentRewards = new BigNumber(amount).multipliedBy(factor).toString();

    return currentRewards;
};
