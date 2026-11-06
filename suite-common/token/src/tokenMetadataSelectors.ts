import { type TokenAddress } from '@suite-common/tokens';
import { type AccountsRootState, selectAccounts } from '@suite-common/wallet-core';
import { type NetworkSymbol } from '@trezor/network-module-types';
import { createWeakMapSelector } from '@trezor/redux-utils';

const createMemoizedSelector = createWeakMapSelector.withTypes<AccountsRootState>();

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

            const token = account.tokens?.find(candidate => candidate.contract === tokenContract);

            if (token) return { ...token, contract: tokenContract };
        }

        return null;
    },
);
