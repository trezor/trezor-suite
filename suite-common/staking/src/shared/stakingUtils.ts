import {
    type NetworkSymbol,
    type NetworkType,
    getStakingProviderByCardanoPoolId,
    getStakingProviderByEthereumPoolName,
    getStakingProviderBySolanaVoterPubkey,
    getStakingProviderByTronSrAddress,
} from '@suite-common/wallet-config';
import {
    CARDANO_EPOCH_DAYS,
    CARDANO_STAKING_REGISTRATION_DEPOSIT,
    MAX_CARDANO_AMOUNT_FOR_STAKING,
    MAX_ETH_AMOUNT_FOR_STAKING,
    MAX_TRON_AMOUNT_FOR_STAKING,
    MIN_CARDANO_AMOUNT_FOR_STAKING,
    MIN_CARDANO_BALANCE_FOR_FEE_BUFFER,
    MIN_CARDANO_BALANCE_FOR_STAKING,
    MIN_CARDANO_FOR_WITHDRAWALS,
    MIN_ETH_AMOUNT_FOR_STAKING,
    MIN_ETH_BALANCE_FOR_FEE_BUFFER,
    MIN_ETH_BALANCE_FOR_STAKING,
    MIN_ETH_FOR_WITHDRAWALS,
    MIN_TRON_AMOUNT_FOR_STAKING,
    MIN_TRON_BALANCE_FOR_FEE_BUFFER,
    MIN_TRON_BALANCE_FOR_STAKING,
    MIN_TRON_FOR_WITHDRAWALS,
    UNSTAKING_ETH_PERIOD,
} from '@suite-common/wallet-constants';
import {
    type Account,
    type PrecomposedLevels,
    type StakeType,
    type StakingLimits,
    type StakingPoolExtended,
    type WalletAccountTransaction,
} from '@suite-common/wallet-types';
import {
    asAmountSubunit,
    getAccountEverstakeStakingPool,
    getAccountTotalStakingBalance,
    getTronAccountTotalStakingBalance,
    isStakeTypeTx,
    isStakingNetworkType,
    isStakingSymbol,
    secondsToDays,
    signatureToStakeTypeMap,
    subunitsToUnits,
} from '@suite-common/wallet-utils';
import {
    MAX_SOL_AMOUNT_FOR_STAKING,
    MIN_SOL_AMOUNT_FOR_STAKING,
    MIN_SOL_BALANCE_FOR_FEE_BUFFER,
    MIN_SOL_BALANCE_FOR_STAKING,
    MIN_SOL_FOR_WITHDRAWALS,
    SOLANA_EPOCH_DAYS,
} from '@trezor/network-solana/constants';
import { exhaustive } from '@trezor/type-utils';
import {
    HELP_CENTER_ADA_STAKING,
    HELP_CENTER_ETH_STAKING,
    HELP_CENTER_SOL_STAKING,
} from '@trezor/urls';
import { BigNumber } from '@trezor/utils';

import {
    isCardanoStakingTx,
    isSupportedAdaStakingNetworkSymbol,
    subtypeToStakeTypeMap,
} from '../cardano/cardanoStakingUtils';
import { getEthereumStakingAddressByType } from '../ethereum/ethereumStaking';
import { isSupportedEthStakingNetworkSymbol } from '../ethereum/ethereumStakingUtils';
import {
    getSolStakingAccountsInfo,
    isSupportedSolStakingNetworkSymbol,
} from '../solana/solanaStakingUtils';
import {
    getTronStakingRewards,
    getTronUnstakingBalance,
    getTronVotes,
    isSupportedTronStakingNetworkSymbol,
    isTronStakingTx,
} from '../tron/tronStakingUtils';

export const isSupportedStakingNetworkSymbol = (symbol: NetworkSymbol) =>
    isSupportedEthStakingNetworkSymbol(symbol) ||
    isSupportedSolStakingNetworkSymbol(symbol) ||
    isSupportedAdaStakingNetworkSymbol(symbol) ||
    isSupportedTronStakingNetworkSymbol(symbol);

export const isSupportedNativeStakingManagementSymbol = (symbol: NetworkSymbol) =>
    isSupportedEthStakingNetworkSymbol(symbol) || isSupportedSolStakingNetworkSymbol(symbol);

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
                MIN_BALANCE_FOR_FEE_BUFFER: MIN_CARDANO_BALANCE_FOR_FEE_BUFFER,
                MIN_BALANCE_FOR_STAKING: MIN_CARDANO_BALANCE_FOR_STAKING,
            };

        case 'trx':
            return {
                MIN_AMOUNT_FOR_STAKING: MIN_TRON_AMOUNT_FOR_STAKING,
                MIN_AMOUNT_FOR_STAKING_DASHBOARD: MIN_TRON_AMOUNT_FOR_STAKING,
                MAX_AMOUNT_FOR_STAKING: MAX_TRON_AMOUNT_FOR_STAKING,
                MIN_FOR_WITHDRAWALS: MIN_TRON_FOR_WITHDRAWALS,
                MIN_BALANCE_FOR_FEE_BUFFER: MIN_TRON_BALANCE_FOR_FEE_BUFFER,
                MIN_BALANCE_FOR_STAKING: MIN_TRON_BALANCE_FOR_STAKING,
            };

        default:
            return exhaustive(symbol);
    }
};

interface GetMaxStakeAmount {
    balance: string;
    symbol: NetworkSymbol | undefined;
}

export const getMaxStakeAmount = ({ balance, symbol }: GetMaxStakeAmount): string => {
    const limits = getStakingLimitsByNetworkSymbol(symbol);
    if (!limits) return '0';

    const balanceBN = new BigNumber(balance);

    const balanceMinusFeeBuffer = BigNumber.max(
        balanceBN.minus(limits.MIN_BALANCE_FOR_FEE_BUFFER),
        0,
    );

    const maxAmount = balanceMinusFeeBuffer.gt(limits.MIN_BALANCE_FOR_STAKING)
        ? BigNumber.max(balanceBN.minus(limits.MIN_FOR_WITHDRAWALS), 0)
        : balanceMinusFeeBuffer;

    return BigNumber.min(maxAmount, limits.MAX_AMOUNT_FOR_STAKING).toFixed();
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
            } = getSolStakingAccountsInfo(account);

            //@ts-expect-error: indexing with noUncheckedIndexedAccess
            const stakedBalance: string = solStakedBalance;
            //@ts-expect-error: indexing with noUncheckedIndexedAccess
            const claimableBalance: string = solClaimableBalance;
            //@ts-expect-error: indexing with noUncheckedIndexedAccess
            const pendingStakeBalance: string = solPendingStakeBalance;
            //@ts-expect-error: indexing with noUncheckedIndexedAccess
            const pendingUnstakeBalance: string = solPendingUnstakeBalance;

            return {
                autocompoundBalance: stakedBalance,
                claimableAmount: claimableBalance,
                depositedBalance: stakedBalance,
                pendingBalance: '',
                pendingDepositedBalance: '',
                totalPendingStakeBalance: pendingStakeBalance,
                restakedReward: '',
                withdrawTotalAmount: pendingUnstakeBalance,
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

            const canClaim = new BigNumber(rewards).gt(0);
            const totalPendingStakeBalance = !canClaim ? account.formattedBalance : '';

            return {
                autocompoundBalance: totalStakedBalance,
                claimableAmount: '',
                depositedBalance: canClaim ? totalStakedBalance : '',
                pendingBalance: '',
                pendingDepositedBalance: '',
                totalPendingStakeBalance,
                restakedReward: formattedRewards,
                withdrawTotalAmount: '',
                canClaim,
            };
        }

        case 'tron': {
            const stakedBalance = getTronAccountTotalStakingBalance(account) ?? '';

            return {
                autocompoundBalance: stakedBalance,
                claimableAmount: '',
                depositedBalance: stakedBalance,
                pendingBalance: '',
                pendingDepositedBalance: '',
                totalPendingStakeBalance: '',
                restakedReward: getTronStakingRewards(account),
                withdrawTotalAmount: getTronUnstakingBalance(account),
                canClaim: false,
            };
        }

        default:
            return exhaustive(account.networkType);
    }
};

interface GetUnstakingPeriodInDays {
    withdrawTime?: number | null; // in seconds
    exitTime?: number | null; // in seconds
}

export const getUnstakingPeriodInDays = (
    networkType: NetworkType | undefined,
    { withdrawTime, exitTime }: GetUnstakingPeriodInDays = {},
) => {
    if (networkType === 'solana') {
        return SOLANA_EPOCH_DAYS;
    }

    if (networkType === 'cardano') {
        return CARDANO_EPOCH_DAYS;
    }

    if (networkType === 'tron') {
        // TODO: move to constants
        return 14;
    }

    if (typeof withdrawTime !== 'number' || typeof exitTime !== 'number') {
        return UNSTAKING_ETH_PERIOD;
    }

    const unstakingPeriodInSeconds = new BigNumber(withdrawTime).plus(exitTime).toNumber();

    return secondsToDays(unstakingPeriodInSeconds);
};

export const getStakingHelpCenterLink = (networkType?: NetworkType) => {
    switch (networkType) {
        case 'ethereum':
            return HELP_CENTER_ETH_STAKING;
        case 'solana':
            return HELP_CENTER_SOL_STAKING;
        case 'cardano':
            return HELP_CENTER_ADA_STAKING;
        default:
            return undefined;
    }
};

export const getOutputTxAmount = (composedLevels?: PrecomposedLevels) => {
    if (!composedLevels) return null;

    const precomposedTx = composedLevels['normal'];
    if (precomposedTx?.type !== 'final') return null;

    const { outputs } = precomposedTx;
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const firstOutput: (typeof outputs)[number] = outputs[0];

    return firstOutput.amount;
};

export const calculateRewards = (amount: string, apyPercent: number | null, days = 365) => {
    if (apyPercent === null) return '0';

    const apy = apyPercent / 100;
    const factor = Math.pow(1 + apy, days / 365) - 1;
    const currentRewards = new BigNumber(amount).multipliedBy(factor).toString();

    return currentRewards;
};

export const calculateGains = (amount: string, apy: number | null, days: number) => {
    const rewards = calculateRewards(amount, apy, days);

    return new BigNumber(rewards).toFixed(5, 1);
};

export const getNetworkAdjustedStakingBalance = (amount: string, account?: Account) => {
    if (account?.networkType === 'cardano') {
        const adjusted = new BigNumber(amount).minus(CARDANO_STAKING_REGISTRATION_DEPOSIT);

        return BigNumber.max(adjusted, 0).toString();
    }

    return amount;
};

export const getStakingContractAddress = (account: Account, stakeType: StakeType) => {
    if (!account) return '';

    switch (account.networkType) {
        case 'ethereum':
            return getEthereumStakingAddressByType(account.symbol, stakeType);
        case 'solana':
        default:
            return account.descriptor;
    }
};

export const getStakingProvidersForAnalytics = (accounts: Account[]): string[] => {
    const providers = new Set<string>();

    accounts.forEach(account => {
        const stakingBalance = getAccountTotalStakingBalance(account);
        if (!stakingBalance || new BigNumber(stakingBalance).lte(0)) {
            return;
        }

        if (!isStakingNetworkType(account.networkType)) {
            return;
        }

        switch (account.networkType) {
            case 'ethereum':
                account.misc?.stakingPools?.forEach(pool => {
                    const provider = getStakingProviderByEthereumPoolName(pool.name);
                    if (provider) {
                        providers.add(provider.id);
                    } else {
                        // Account is staked but provider is unknown
                        providers.add('unknown');
                    }
                });
                break;
            case 'solana':
                [
                    ...(account.misc?.solStakingAccounts ?? []),
                    ...(account.misc?.solExternalStakingAccounts ?? []),
                ].forEach(stakingAccount => {
                    if (stakingAccount.voterPubkey) {
                        const provider = getStakingProviderBySolanaVoterPubkey(
                            stakingAccount.voterPubkey,
                        );
                        if (provider) {
                            providers.add(provider.id);
                        } else {
                            // Account is staked but provider is unknown
                            providers.add('unknown');
                        }
                    }
                });
                break;
            case 'cardano': {
                const poolId = account.misc?.staking?.poolId;
                if (!poolId) break;

                const provider = getStakingProviderByCardanoPoolId(poolId);
                if (provider) {
                    providers.add(provider.id);
                } else {
                    // Account is staked but provider is unknown
                    providers.add('unknown');
                }
                break;
            }
            case 'tron':
                getTronVotes(account).forEach(vote => {
                    const provider = getStakingProviderByTronSrAddress(vote.address);
                    if (provider) {
                        providers.add(provider.id);
                    } else {
                        // Account is staked but provider is unknown
                        providers.add('unknown');
                    }
                });
                break;
            default:
                exhaustive(account.networkType);
        }
    });

    return Array.from(providers);
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

export const isStakingTransaction = (transaction: WalletAccountTransaction) => {
    // Cardano staking transactions
    if (isCardanoStakingTx(transaction)) {
        return true;
    }

    // Solana staking transactions
    if (transaction.solanaSpecific?.stakeOperation?.type) {
        return true;
    }

    // Ethereum staking transactions
    if (isStakeTypeTx(transaction.ethereumSpecific?.parsedData?.methodId)) {
        return true;
    }

    if (isTronStakingTx(transaction)) {
        return true;
    }

    return false;
};
