import { AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { TokenInfo } from '@trezor/blockchain-link';

import { filterTokenHasBalance } from './utils';

export const selectEthereumAccountsTokens = (
    state: AccountsRootState,
    ethereumAccountKey: string,
): TokenInfo[] | null => {
    const account = selectAccountByKey(state, ethereumAccountKey);
    if (account?.symbol !== 'eth') return null;
    return account.tokens?.filter(filterTokenHasBalance) ?? null;
};
