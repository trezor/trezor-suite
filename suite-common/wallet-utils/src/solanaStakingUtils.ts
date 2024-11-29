import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Solana, SolNetwork } from '@everstake/wallet-sdk';

import { NetworkSymbol } from '@suite-common/wallet-config';
import { BigNumber, isArrayMember } from '@trezor/utils';
import {
    Account,
    SolanaStakingAccount,
    supportedSolanaNetworkSymbols,
    SupportedSolanaNetworkSymbols,
} from '@suite-common/wallet-types';
import { SOLANA_DEV_NET_URL, SOLANA_MAIN_NET_URL } from '@suite-common/wallet-constants';

export function isSupportedSolStakingNetworkSymbol(
    networkSymbol: NetworkSymbol,
): networkSymbol is SupportedSolanaNetworkSymbols {
    return isArrayMember(networkSymbol, supportedSolanaNetworkSymbols);
}

export const formatSolanaStakingAmount = (amount: string | null) => {
    if (!amount) return null;

    return new BigNumber(amount).div(LAMPORTS_PER_SOL).toFixed(9);
};

interface SolNetworkConfig {
    network: SolNetwork;
    url: string;
}

export const getSolNetworkForWalletSdk = (symbol: NetworkSymbol): SolNetworkConfig => {
    const solNetworks: { [key in NetworkSymbol]?: SolNetworkConfig } = {
        dsol: { network: SolNetwork.Devnet, url: SOLANA_DEV_NET_URL },
        sol: { network: SolNetwork.Mainnet, url: SOLANA_MAIN_NET_URL },
    };

    return solNetworks[symbol] || solNetworks.sol!;
};

export const selectSolanaWalletSdkNetwork = (symbol: NetworkSymbol) => {
    const { network, url } = getSolNetworkForWalletSdk(symbol);

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
    if (!account) return null;

    const { stakingAccounts } = account;
    if (!stakingAccounts) return null;

    const totalStakingBalance = calculateTotalSolStakingBalance(stakingAccounts);

    return formatSolanaStakingAmount(totalStakingBalance);
};

export const toLamports = (amount: string | BigNumber | number) => {
    return new BigNumber(amount).times(LAMPORTS_PER_SOL).toString();
};
