import { type TokenAddress } from '@suite-common/tokens';
import { type AccountsRootState, selectAccounts } from '@suite-common/wallet-core';
import { type NetworkSymbol } from '@trezor/network-module-types';
import { createWeakMapSelector } from '@trezor/redux-utils';

const createMemoizedSelector = createWeakMapSelector.withTypes<AccountsRootState>();

type AccountToken = NonNullable<AccountsRootState['wallet']['accounts'][number]['tokens']>[number];

export const selectTokenByNetworkAndContract = createMemoizedSelector(
    [
        selectAccounts,
        (_state: AccountsRootState, networkSymbol: NetworkSymbol) => networkSymbol,
        (_state: AccountsRootState, _networkSymbol: NetworkSymbol, tokenContract: TokenAddress) =>
            tokenContract,
    ],
    (accounts, networkSymbol, tokenContract) => {
        for (const account of accounts) {
            if (account.symbol !== networkSymbol) continue;

            // The stored token itself, so its labels re-render only when that token changes.
            const token = account.tokens?.find(
                (candidate): candidate is AccountToken & { contract: TokenAddress } =>
                    candidate.contract === tokenContract,
            );

            if (token) return token;
        }

        return null;
    },
);
