import { A, G } from '@mobily/ts-belt';

import { AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { TokenInfo } from '@trezor/blockchain-link';

export const filterTokenHasBalance = (token: TokenInfo) => !!token.balance && token.balance !== '0';

export const selectEthereumAccountsTokens = (
    state: AccountsRootState,
    ethereumAccountKey: string,
): TokenInfo[] | null => {
    const account = selectAccountByKey(state, ethereumAccountKey);
    if (account?.symbol !== 'eth') return null;
    return account.tokens?.filter(filterTokenHasBalance) ?? null;
};

// If account item is ethereum which has tokens with non-zero balance,
// we want to adjust styling to display token items.
export const isEthereumAccountWithTokensWithBalance = (
    state: AccountsRootState,
    ethereumAccountKey: string,
): boolean => {
    const account = selectAccountByKey(state, ethereumAccountKey);
    if (account?.symbol !== 'eth') return false;
    return (
        account.symbol === 'eth' &&
        G.isArray(account.tokens) &&
        A.isNotEmpty(account.tokens.filter(filterTokenHasBalance))
    );
};

export const selectEthereumAccountTokensWithBalance = (
    state: AccountsRootState,
    accountKey: string,
): TokenInfo[] | null => {
    const account = selectAccountByKey(state, accountKey);
    return account?.tokens?.filter(filterTokenHasBalance) ?? null;
};
