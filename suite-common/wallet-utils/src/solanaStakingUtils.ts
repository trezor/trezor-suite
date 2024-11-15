import { LAMPORTS_PER_SOL } from '@solana/web3.js';
// @ts-expect-error: Could not find a declaration file for module '@everstake/wallet-sdk/solana'.
import { getDelegations, selectNetwork } from '@everstake/wallet-sdk/solana';

import { NetworkSymbol } from '@suite-common/wallet-config';
import { BigNumber, isArrayMember } from '@trezor/utils';
import {
    Account,
    SolanaStakingAccount,
    supportedSolanaNetworkSymbols,
    SupportedSolanaNetworkSymbols,
} from '@suite-common/wallet-types';

export function isSupportedSolStakingNetworkSymbol(
    networkSymbol: NetworkSymbol,
): networkSymbol is SupportedSolanaNetworkSymbols {
    return isArrayMember(networkSymbol, supportedSolanaNetworkSymbols);
}

export const formatSolanaStakingAmount = (amount: string | null) => {
    if (!amount) return null;

    return new BigNumber(amount).div(LAMPORTS_PER_SOL).toFixed(9);
};

type SolNetwork = 'devnet' | 'mainnet-beta';

export const getSolNetworkForWalletSdk = (symbol: NetworkSymbol): SolNetwork => {
    const solNetworks: { [key in NetworkSymbol]?: SolNetwork } = {
        dsol: 'devnet',
        sol: 'mainnet-beta',
    };

    return solNetworks[symbol] || solNetworks.sol!;
};

export const selectSolanaWalletSdkNetwork = (symbol: NetworkSymbol) => {
    const network = getSolNetworkForWalletSdk(symbol);
    selectNetwork(network);
};
export const calculateTotalSolStakingBalance = (stakingAccounts: SolanaStakingAccount[]) => {
    if (!stakingAccounts?.length) return null;

    const totalAmount = stakingAccounts.reduce((acc, solAccount) => {
        const { account } = solAccount;

        return acc.plus(account?.data.parsed.info.stake.delegation.stake);
    }, new BigNumber(0));

    return totalAmount.toString();
};

export const getSolAccountTotalStakingBalance = (account: Account) => {
    if (!account) return null;

    const { stakingAccounts } = account;
    if (!stakingAccounts) return null;

    const totalStakingBalance = calculateTotalSolStakingBalance(stakingAccounts);

    return formatSolanaStakingAmount(totalStakingBalance);
};

export const getSolanaStakingAccounts = async (account: Account) => {
    if (!account) return null;

    selectSolanaWalletSdkNetwork(account.symbol);

    const delegations = await getDelegations(account.descriptor);
    const { result: stakingAccounts } = delegations;
    if (!stakingAccounts) return null;

    return stakingAccounts;
};

export const toLamports = (amount: string | BigNumber | number) => {
    return new BigNumber(amount).times(LAMPORTS_PER_SOL).toString();
};
