import { Network, Solana, StakeState } from '@everstake/wallet-sdk-solana';

import { NetworkSymbol, getNetworkFeatures } from '@suite-common/wallet-config';
import { SOLANA_EPOCH_DAYS } from '@suite-common/wallet-constants';
import {
    Account,
    SupportedSolanaNetworkSymbols,
    supportedSolanaNetworkSymbols,
} from '@suite-common/wallet-types';
import { SolanaStakingAccount } from '@trezor/blockchain-link-types/src/solana';
import { getSuiteVersion } from '@trezor/env-utils';
import { PartialRecord } from '@trezor/type-utils';
import { BigNumber, isArrayMember } from '@trezor/utils';

import { formatNetworkAmount } from './accountUtils';

export function isSupportedSolStakingNetworkSymbol(
    symbol: NetworkSymbol,
): symbol is SupportedSolanaNetworkSymbols {
    return isArrayMember(symbol, supportedSolanaNetworkSymbols);
}

export const getSolanaStakingSymbols = (networkSymbols: NetworkSymbol[]) =>
    networkSymbols.reduce((acc, networkSymbol) => {
        if (
            isSupportedSolStakingNetworkSymbol(networkSymbol) &&
            getNetworkFeatures(networkSymbol).includes('staking')
        ) {
            acc.push(networkSymbol);
        }

        return acc;
    }, [] as SupportedSolanaNetworkSymbols[]);

interface SolNetworkConfig {
    network: Network;
}

export const getSolNetworkForWalletSdk = (symbol: NetworkSymbol): SolNetworkConfig => {
    const solNetworks: PartialRecord<NetworkSymbol, SolNetworkConfig> = {
        dsol: { network: Network.Devnet },
        sol: { network: Network.Mainnet },
    };

    return solNetworks[symbol] || solNetworks.sol!;
};

export const selectSolanaWalletSdkNetwork = (symbol: NetworkSymbol, url?: string) => {
    const { network } = getSolNetworkForWalletSdk(symbol);

    return new Solana(network, {
        rpc: url,
        userAgent: `Trezor Suite ${getSuiteVersion()}`,
    });
};

export const calculateTotalSolStakingBalance = (stakingAccounts: SolanaStakingAccount[]) => {
    if (!stakingAccounts?.length) return null;

    const totalAmount = stakingAccounts.reduce((acc, account) => {
        if (account?.stake) {
            const delegationStake = account.stake?.toString();

            if (delegationStake != null) {
                return acc.plus(delegationStake);
            }
        }

        return acc;
    }, new BigNumber(0));

    return totalAmount.toString();
};

export const getSolAccountTotalStakingBalance = (account: Account) => {
    if (!account?.misc || account.networkType !== 'solana') {
        return null;
    }

    const { solStakingAccounts } = account.misc;
    if (!solStakingAccounts) return null;

    const totalStakingBalance = calculateTotalSolStakingBalance(solStakingAccounts);
    if (!totalStakingBalance) return null;

    return formatNetworkAmount(totalStakingBalance, account.symbol);
};

export const calculateSolanaStakingReward = (accountBalance?: string, apy?: string) => {
    if (!accountBalance || !apy) return '0';

    return new BigNumber(accountBalance ?? '')
        .multipliedBy(apy ?? '0')
        .dividedBy(100)
        .dividedBy(365)
        .multipliedBy(SOLANA_EPOCH_DAYS)
        .toFixed(9)
        .toString();
};

export const getSolanaStakingAccountsByStatus = (account: Account, status: string) => {
    if (account?.networkType !== 'solana') return [];

    const { solStakingAccounts } = account?.misc ?? {};
    if (!solStakingAccounts) return [];

    return solStakingAccounts.filter(solStakingAccount => solStakingAccount.status === status);
};

export const getStakingAccountCurrentStatus = (account?: Account) => {
    if (account?.networkType !== 'solana') return null;

    const statusesToCheck = [StakeState.Inactive, StakeState.Activating];

    for (const status of statusesToCheck) {
        const stakingAccounts = getSolanaStakingAccountsByStatus(account, status);
        if (stakingAccounts.length) return status;
    }

    return null;
};

export const getSolStakingAccountTotalBalanceByStatus = (account: Account, status: string) => {
    if (account.networkType !== 'solana') return '0';

    const selectedStakingAccounts = getSolanaStakingAccountsByStatus(account, status);
    const stakingBalance = calculateTotalSolStakingBalance(selectedStakingAccounts) ?? '0';

    return formatNetworkAmount(stakingBalance, account.symbol);
};

type StakeStateType = (typeof StakeState)[keyof typeof StakeState];

export const getSolStakingAccountsInfo = (account: Account) => {
    const balanceResults = Object.values(StakeState).map(status => {
        const balance = getSolStakingAccountTotalBalanceByStatus(account, status);

        return [status, balance];
    });

    const balances: Record<StakeStateType, string> = balanceResults.reduce(
        (acc, [status, balance]) => ({ ...acc, [status]: balance }),
        {},
    );

    return {
        solStakedBalance: balances[StakeState.Active],
        solClaimableBalance: balances[StakeState.Deactivated],
        solPendingStakeBalance: balances[StakeState.Activating],
        solPendingUnstakeBalance: balances[StakeState.Deactivating],
        canClaimSol: new BigNumber(balances[StakeState.Deactivated]).gt(0),
        canUnstakeSol: new BigNumber(balances[StakeState.Active]).gt(0),
    };
};
