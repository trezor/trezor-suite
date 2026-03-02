import {
    NetworkSymbol,
    NetworkType,
    STAKING_SYMBOLS,
    STAKING_TYPES,
    StakingNetworkSymbol,
    StakingNetworkType,
} from '@suite-common/wallet-config';
import {
    CARDANO_EPOCH_DAYS,
    CARDANO_STAKING_REGISTRATION_DEPOSIT,
    MAX_CARDANO_AMOUNT_FOR_STAKING,
    MAX_ETH_AMOUNT_FOR_STAKING,
    MAX_SOL_AMOUNT_FOR_STAKING,
    MIN_CARDANO_AMOUNT_FOR_STAKING,
    MIN_CARDANO_BALANCE_FOR_STAKING,
    MIN_CARDANO_FOR_WITHDRAWALS,
    MIN_ETH_AMOUNT_FOR_STAKING,
    MIN_ETH_BALANCE_FOR_FEE_BUFFER,
    MIN_ETH_BALANCE_FOR_STAKING,
    MIN_ETH_FOR_WITHDRAWALS,
    MIN_SOL_AMOUNT_FOR_STAKING,
    MIN_SOL_BALANCE_FOR_FEE_BUFFER,
    MIN_SOL_BALANCE_FOR_STAKING,
    MIN_SOL_FOR_WITHDRAWALS,
    SOLANA_EPOCH_DAYS,
    UNSTAKING_ETH_PERIOD,
} from '@suite-common/wallet-constants';
import {
    Account,
    PrecomposedLevels,
    StakingLimits,
    StakingPoolExtended,
    WalletAccountTransaction,
} from '@suite-common/wallet-types';
import { exhaustive } from '@trezor/type-utils';
import { BigNumber } from '@trezor/utils';

import { asAmountSubunit } from './AmountTypes';
import { subunitsToUnits } from './amountUtils';
import {
    getAdaAccountTotalStakingBalance,
    isSupportedAdaStakingNetworkSymbol,
    subtypeToStakeTypeMap,
} from './cardanoStakingUtils';
import {
    getAccountEverstakeStakingPool,
    getEthAccountTotalStakingBalance,
    isSupportedEthStakingNetworkSymbol,
    signatureToStakeTypeMap,
} from './ethereumStakingUtils';
import {
    getSolAccountTotalStakingBalance,
    getSolStakingAccountsInfo,
    isSupportedSolStakingNetworkSymbol,
} from './solanaStakingUtils';

export const secondsToDays = (seconds: number) => Math.round(seconds / 60 / 60 / 24);

export const isStakingNetworkType = (type: NetworkType): type is StakingNetworkType =>
    (STAKING_TYPES as readonly string[]).includes(type);

export const isStakingSymbol = (symbol: NetworkSymbol): symbol is StakingNetworkSymbol =>
    (STAKING_SYMBOLS as readonly string[]).includes(symbol);

const STAKING_BALANCE_BY_TYPE = {
    ethereum: getEthAccountTotalStakingBalance,
    solana: getSolAccountTotalStakingBalance,
    cardano: getAdaAccountTotalStakingBalance,
} satisfies Record<StakingNetworkType, (a: Account) => string | null>;

export const getAccountTotalStakingBalance = (account: Account) =>
    isStakingNetworkType(account.networkType)
        ? STAKING_BALANCE_BY_TYPE[account.networkType](account)
        : null;

export const isSupportedStakingNetworkSymbol = (symbol: NetworkSymbol) =>
    isSupportedEthStakingNetworkSymbol(symbol) ||
    isSupportedSolStakingNetworkSymbol(symbol) ||
    isSupportedAdaStakingNetworkSymbol(symbol);

export const getStakingLimitsByNetworkSymbol = (
    symbol: NetworkSymbol | undefined,
): StakingLimits | null => {
    if (!symbol || !isStakingSymbol(symbol)) return null;

    switch (symbol) {
        case 'thod':
        case 'eth':
            return {
                MIN_AMOUNT_FOR_STAKING: MIN_ETH_AMOUNT_FOR_STAKING,
                MIN_AMOUNT_FOR_STAKING_DASHBOARD: MIN_ETH_AMOUNT_FOR_STAKING,
                MAX_AMOUNT_FOR_STAKING: MAX_ETH_AMOUNT_FOR_STAKING,
                MIN_FOR_WITHDRAWALS: MIN_ETH_FOR_WITHDRAWALS,
                MIN_BALANCE_FOR_FEE_BUFFER: MIN_ETH_BALANCE_FOR_FEE_BUFFER,
                MIN_BALANCE_FOR_STAKING: MIN_ETH_BALANCE_FOR_STAKING,
            };

        case 'dsol':
        case 'sol':
            return {
                MIN_AMOUNT_FOR_STAKING: MIN_SOL_AMOUNT_FOR_STAKING,
                MIN_AMOUNT_FOR_STAKING_DASHBOARD: MIN_SOL_AMOUNT_FOR_STAKING,
                MAX_AMOUNT_FOR_STAKING: MAX_SOL_AMOUNT_FOR_STAKING,
                MIN_FOR_WITHDRAWALS: MIN_SOL_FOR_WITHDRAWALS,
                MIN_BALANCE_FOR_FEE_BUFFER: MIN_SOL_BALANCE_FOR_FEE_BUFFER,
                MIN_BALANCE_FOR_STAKING: MIN_SOL_BALANCE_FOR_STAKING,
            };

        case 'ada':
            return {
                MIN_AMOUNT_FOR_STAKING: MIN_CARDANO_AMOUNT_FOR_STAKING,
                MIN_AMOUNT_FOR_STAKING_DASHBOARD: MIN_CARDANO_AMOUNT_FOR_STAKING.plus(
                    CARDANO_STAKING_REGISTRATION_DEPOSIT,
                ),
                MAX_AMOUNT_FOR_STAKING: MAX_CARDANO_AMOUNT_FOR_STAKING,
                MIN_FOR_WITHDRAWALS: MIN_CARDANO_FOR_WITHDRAWALS,
                MIN_BALANCE_FOR_FEE_BUFFER: MIN_ETH_BALANCE_FOR_FEE_BUFFER,
                MIN_BALANCE_FOR_STAKING: MIN_CARDANO_BALANCE_FOR_STAKING,
            };

        default:
            return exhaustive(symbol);
    }
};

export const getStakingDataForNetwork = (
    account?: Account,
): Omit<StakingPoolExtended, 'contract' | 'name'> | undefined => {
    if (!account || !isStakingNetworkType(account.networkType)) return;

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
            return exhaustive(account.networkType);
    }
};

interface GetUnstakingPeriodInDays {
    networkType?: NetworkType;
    validatorWithdrawTime?: number | null; // in seconds
    validatorExitTime?: number | null; // in seconds
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

    if (typeof validatorWithdrawTime !== 'number' || typeof validatorExitTime !== 'number') {
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

export const calculateRewards = (amount: string, apyPercent: number | null, days = 365) => {
    if (apyPercent === null) return '0';

    const apy = apyPercent / 100;
    const factor = Math.pow(1 + apy, days / 365) - 1;
    const currentRewards = new BigNumber(amount).multipliedBy(factor).toString();

    return currentRewards;
};

export const getTxStakeType = (tx: WalletAccountTransaction) => {
    const signature = tx?.ethereumSpecific?.parsedData?.methodId;

    if (signature) {
        return signatureToStakeTypeMap[signature];
    }

    if (tx?.solanaSpecific?.stakeOperation) {
        return tx?.solanaSpecific.stakeOperation?.type;
    }

    if (tx?.cardanoSpecific?.subtype) {
        return subtypeToStakeTypeMap[tx?.cardanoSpecific.subtype];
    }
};
