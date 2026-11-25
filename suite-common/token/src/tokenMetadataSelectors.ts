import { type TokenAddress, normalizeTokenAddress } from '@suite-common/tokens';
import { type AccountsRootState, selectAccounts } from '@suite-common/wallet-core';
import { type NetworkSymbol } from '@trezor/network-module-types';
import { createWeakMapSelector } from '@trezor/redux-utils';

const createMemoizedSelector = createWeakMapSelector.withTypes<AccountsRootState>();

type AccountToken = NonNullable<AccountsRootState['wallet']['accounts'][number]['tokens']>[number];

const selectAccountTokensByNetwork = createMemoizedSelector([selectAccounts], accounts => {
    const tokensByNetwork = new Map<
        NetworkSymbol,
        Map<string, AccountToken & { contract: TokenAddress }>
    >();

    for (const account of accounts) {
        let tokens = tokensByNetwork.get(account.symbol);
        if (!tokens) {
            tokens = new Map();
            tokensByNetwork.set(account.symbol, tokens);
        }
        for (const token of account.tokens ?? []) {
            const key = normalizeTokenAddress(account.symbol, token.contract);
            if (!tokens.has(key)) {
                // Preserve the first account's original token object, including address casing.
                tokens.set(key, token as AccountToken & { contract: TokenAddress });
            }
        }
    }

    return tokensByNetwork;
});

export const selectTokenByNetworkAndContract = createMemoizedSelector(
    [
        selectAccountTokensByNetwork,
        (_state: AccountsRootState, networkSymbol: NetworkSymbol) => networkSymbol,
        (_state: AccountsRootState, _networkSymbol: NetworkSymbol, tokenContract: TokenAddress) =>
            tokenContract,
    ],
    (tokensByNetwork, networkSymbol, tokenContract) =>
        tokensByNetwork
            .get(networkSymbol)
            ?.get(normalizeTokenAddress(networkSymbol, tokenContract)) ?? null,
);
