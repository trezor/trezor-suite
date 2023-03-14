import { A, G } from '@mobily/ts-belt';

import { AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { TokenInfo } from '@trezor/blockchain-link';

import { EthereumTokenAccountWithBalance } from './types';
import { isEthereumAccountSymbol } from './utils';

const filterTokenHasBalance = (token: TokenInfo) => !!token.balance && token.balance !== '0';

export const selectEthereumAccountsTokensWithBalance = (
    state: AccountsRootState,
    ethereumAccountKey: string,
): EthereumTokenAccountWithBalance[] => {
    const account = selectAccountByKey(state, ethereumAccountKey);
    if (!account || !isEthereumAccountSymbol(account.symbol)) return [];
    return account.tokens?.filter(filterTokenHasBalance) as EthereumTokenAccountWithBalance[];
};

// If account item is ethereum which has tokens with non-zero balance,
// we want to adjust styling to display token items.
export const selectIsEthereumAccountWithTokensWithBalance = (
    state: AccountsRootState,
    ethereumAccountKey: string,
): boolean => {
    const account = selectAccountByKey(state, ethereumAccountKey);
    return (
        !!account &&
        isEthereumAccountSymbol(account.symbol) &&
        G.isArray(account.tokens) &&
        A.isNotEmpty(account.tokens.filter(filterTokenHasBalance))
    );
};

export const selectEthereumAccountTokensWithBalance = (
    state: AccountsRootState,
    accountKey: string,
): TokenInfo[] => {
    const account = selectAccountByKey(state, accountKey);
    return account?.tokens?.filter(filterTokenHasBalance) ?? [];
};
