import { Solana, SolNetwork } from '@everstake/wallet-sdk';

import { NetworkSymbol } from '@suite-common/wallet-config';
import { BigNumber, isArrayMember } from '@trezor/utils';
import { SolanaStakingAccount } from '@trezor/blockchain-link-types/src/solana';
import {
    Account,
    supportedSolanaNetworkSymbols,
    SupportedSolanaNetworkSymbols,
} from '@suite-common/wallet-types';
import { LAMPORTS_PER_SOL } from '@suite-common/wallet-constants';
import { PartialRecord } from '@trezor/type-utils';

export function isSupportedSolStakingNetworkSymbol(
    symbol: NetworkSymbol,
): symbol is SupportedSolanaNetworkSymbols {
    return isArrayMember(symbol, supportedSolanaNetworkSymbols);
}

export const formatSolanaStakingAmount = (amount: string | null) => {
    if (!amount) return null;

    return new BigNumber(amount).div(LAMPORTS_PER_SOL).toFixed(9);
};

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

    return formatSolanaStakingAmount(totalStakingBalance);
};
