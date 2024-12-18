import { Solana, SolDelegation, SolNetwork, StakeAccount, StakeState } from '@everstake/wallet-sdk';

import { getNetworkFeatures, NetworkSymbol } from '@suite-common/wallet-config';
import { BigNumber, isArrayMember } from '@trezor/utils';
import { SolanaStakingAccount } from '@trezor/blockchain-link-types/src/solana';
import {
    Account,
    supportedSolanaNetworkSymbols,
    SupportedSolanaNetworkSymbols,
} from '@suite-common/wallet-types';
import { PartialRecord } from '@trezor/type-utils';
import { SOLANA_EPOCH_DAYS } from '@suite-common/wallet-constants';

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
    network: SolNetwork;
}

export const getSolNetworkForWalletSdk = (symbol: NetworkSymbol): SolNetworkConfig => {
    const solNetworks: PartialRecord<NetworkSymbol, SolNetworkConfig> = {
        dsol: { network: SolNetwork.Devnet },
        sol: { network: SolNetwork.Mainnet },
    };

    return solNetworks[symbol] || solNetworks.sol!;
};

export const selectSolanaWalletSdkNetwork = (symbol: NetworkSymbol, url?: string) => {
    const { network } = getSolNetworkForWalletSdk(symbol);

    return new Solana(network, url);
};

export const calculateTotalSolStakingBalance = (stakingAccounts: SolanaStakingAccount[]) => {
    if (!stakingAccounts?.length) return null;

    const totalAmount = stakingAccounts.reduce((acc, solAccount) => {
        const { account } = solAccount;

        if ('parsed' in account.data) {
            return acc.plus(account.data.parsed.info.stake.delegation.stake);
        }

        return acc;
    }, new BigNumber(0));

    return totalAmount.toString();
};

export const getSolAccountTotalStakingBalance = (account: Account) => {
    if (!account || account.networkType !== 'solana') {
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

export const getStakingAccountStatus = (
    solStakingAccount: SolDelegation['account'],
    epoch: number,
) => {
    const stakeAccountClient = new StakeAccount(solStakingAccount);

    return stakeAccountClient.stakeAccountState(epoch);
};

interface StakingAccountWithStatus extends SolDelegation {
    status: string;
}

export const getSolanaStakingAccountsWithStatus = (
    account: Account,
): StakingAccountWithStatus[] | null => {
    if (account.networkType !== 'solana') return null;

    const { solStakingAccounts, solEpoch } = account.misc;
    if (!solStakingAccounts?.length || !solEpoch) return null;

    const stakingAccountsWithStatus = solStakingAccounts.map(solStakingAccount => {
        const status = getStakingAccountStatus(solStakingAccount.account, solEpoch);

        return {
            ...solStakingAccount,
            status,
        };
    });

    return stakingAccountsWithStatus;
};

export const getSolanaStakingAccountsByStatus = (account: Account, status: string) => {
    const stakingAccountsWithStatus = getSolanaStakingAccountsWithStatus(account);

    if (!stakingAccountsWithStatus) return [];

    return stakingAccountsWithStatus.filter(
        solStakingAccount => solStakingAccount.status === status,
    );
};

export const getStakingAccountCurrentStatus = (account?: Account) => {
    if (account?.networkType !== 'solana') return null;

    const statusesToCheck = [StakeState.inactive, StakeState.activating];

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
    const balanceResults = Object.entries(StakeState).map(([key, status]) => {
        const balance = getSolStakingAccountTotalBalanceByStatus(account, status);

        return [key, balance];
    });

    const balances: Record<StakeStateType, string> = balanceResults.reduce(
        (acc, [key, balance]) => ({ ...acc, [key]: balance }),
        {},
    );

    return {
        solStakedBalance: balances[StakeState.active],
        solClaimableBalance: balances[StakeState.deactivated],
        solPendingStakeBalance: balances[StakeState.activating],
        solPendingUnstakeBalance: balances[StakeState.deactivating],
        canClaimSol: new BigNumber(balances[StakeState.deactivated]).gt(0),
        canUnstakeSol: new BigNumber(balances[StakeState.active]).gt(0),
    };
};
