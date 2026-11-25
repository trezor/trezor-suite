import {
    type NetworkSymbol,
    type NetworkType,
    getStakingProviderByCardanoPoolId,
    getStakingProviderByEthereumPoolName,
    getStakingProviderBySolanaVoterPubkey,
    getStakingProviderByTronSrAddress,
} from '@suite-common/wallet-config';
import {
    CARDANO_STAKING_REGISTRATION_DEPOSIT,
    MIN_ETH_BALANCE_FOR_FEE_BUFFER,
} from '@suite-common/wallet-constants';
import {
    type Account,
    type PrecomposedLevels,
    type StakeType,
    type StakingLimits,
    type WalletAccountTransaction,
} from '@suite-common/wallet-types';
import {
    getAccountTotalStakingBalance,
    isStakeTypeTx,
    isStakingNetworkType,
    isStakingSymbol,
    signatureToStakeTypeMap,
} from '@suite-common/wallet-utils';
import {
    MAX_SOL_AMOUNT_FOR_STAKING,
    MIN_SOL_AMOUNT_FOR_STAKING,
    MIN_SOL_BALANCE_FOR_FEE_BUFFER,
    MIN_SOL_BALANCE_FOR_STAKING,
    MIN_SOL_FOR_WITHDRAWALS,
} from '@trezor/network-solana/constants';
import { exhaustive } from '@trezor/type-utils';
import {
    HELP_CENTER_ADA_STAKING,
    HELP_CENTER_ETH_STAKING,
    HELP_CENTER_SOL_STAKING,
} from '@trezor/urls';
import { BigNumber } from '@trezor/utils';

import {
    MAX_CARDANO_AMOUNT_FOR_STAKING,
    MIN_CARDANO_AMOUNT_FOR_STAKING,
    MIN_CARDANO_BALANCE_FOR_FEE_BUFFER,
    MIN_CARDANO_BALANCE_FOR_STAKING,
    MIN_CARDANO_FOR_WITHDRAWALS,
} from '../cardano/cardanoStakingConstants';
import { isCardanoStakingTx, subtypeToStakeTypeMap } from '../cardano/cardanoStakingUtils';
import { getEthereumStakingAddressByType } from '../ethereum/ethereumStaking';
import {
    MAX_ETH_AMOUNT_FOR_STAKING,
    MIN_ETH_AMOUNT_FOR_STAKING,
    MIN_ETH_BALANCE_FOR_STAKING,
    MIN_ETH_FOR_WITHDRAWALS,
    MIN_THOD_AMOUNT_FOR_STAKING,
    MIN_THOD_BALANCE_FOR_STAKING,
} from '../ethereum/ethereumStakingConstants';
import {
    MAX_TRON_AMOUNT_FOR_STAKING,
    MIN_TRON_AMOUNT_FOR_STAKING,
    MIN_TRON_BALANCE_FOR_FEE_BUFFER,
    MIN_TRON_BALANCE_FOR_STAKING,
    MIN_TRON_FOR_WITHDRAWALS,
} from '../tron/tronStakingConstants';
import { getTronVotes, isTronStakingTx } from '../tron/tronStakingUtils';

export const getStakingLimitsByNetworkSymbol = (
    symbol: NetworkSymbol | undefined,
): StakingLimits | null => {
    if (!symbol || !isStakingSymbol(symbol)) return null;

    switch (symbol) {
        case 'eth':
            return {
                MIN_AMOUNT_FOR_STAKING: MIN_ETH_AMOUNT_FOR_STAKING,
                MIN_AMOUNT_FOR_STAKING_DASHBOARD: MIN_ETH_AMOUNT_FOR_STAKING,
                MAX_AMOUNT_FOR_STAKING: MAX_ETH_AMOUNT_FOR_STAKING,
                MIN_FOR_WITHDRAWALS: MIN_ETH_FOR_WITHDRAWALS,
                MIN_BALANCE_FOR_FEE_BUFFER: MIN_ETH_BALANCE_FOR_FEE_BUFFER,
                MIN_BALANCE_FOR_STAKING: MIN_ETH_BALANCE_FOR_STAKING,
            };

        case 'thod':
            return {
                MIN_AMOUNT_FOR_STAKING: MIN_THOD_AMOUNT_FOR_STAKING,
                MIN_AMOUNT_FOR_STAKING_DASHBOARD: MIN_THOD_AMOUNT_FOR_STAKING,
                MAX_AMOUNT_FOR_STAKING: MAX_ETH_AMOUNT_FOR_STAKING,
                MIN_FOR_WITHDRAWALS: MIN_ETH_FOR_WITHDRAWALS,
                MIN_BALANCE_FOR_FEE_BUFFER: MIN_ETH_BALANCE_FOR_FEE_BUFFER,
                MIN_BALANCE_FOR_STAKING: MIN_THOD_BALANCE_FOR_STAKING,
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
    const precomposedTx = composedLevels?.['normal'];

    if (precomposedTx?.type !== 'final') return null;

    return precomposedTx?.outputs?.[0]?.amount ?? null;
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

export const hasAccountStakedForAnalytics = (account: Account): boolean => {
    if (account.networkType === 'solana') {
        return [
            ...(account.misc?.solStakingAccounts ?? []),
            ...(account.misc?.solExternalStakingAccounts ?? []),
        ].some(stakingAccount => new BigNumber(stakingAccount.stake ?? '0').gt(0));
    }

    return new BigNumber(getAccountTotalStakingBalance(account) ?? '0').gt(0);
};

export const getStakingProvidersForAnalytics = (accounts: Account[]): string[] => {
    const providers = new Set<string>();

    accounts.forEach(account => {
        if (!hasAccountStakedForAnalytics(account)) {
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
                    if (
                        stakingAccount.voterPubkey &&
                        new BigNumber(stakingAccount.stake ?? '0').gt(0)
                    ) {
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
        return signatureToStakeTypeMap[signature.toLowerCase()];
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
