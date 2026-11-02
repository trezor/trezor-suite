import { type AccountItem } from '@suite-common/graph';
import {
    type AccountsRootState,
    type FiatRatesRootState,
    type WalletSettingsRootState,
    selectAccountByKey,
    selectAccountDefiTokens,
    selectAccountManuallyHiddenTokens,
    selectAccountUnrecognizedTokens,
} from '@suite-common/wallet-core';
import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import {
    hasAccountOrTokenSpendableBalance,
    tryGetAccountIdentity,
} from '@suite-common/wallet-utils';
import { type AccountOverviewTab } from '@suite-native/navigation';
import { type TokensRootState } from '@suite-native/tokens';
import { createWeakMapSelector } from '@trezor/redux-utils';
import { deepEqual } from '@trezor/utils';

const createAccountsMemoizedSelector = createWeakMapSelector.withTypes<AccountsRootState>();

export const selectAccountItemForGraph = createAccountsMemoizedSelector(
    [
        selectAccountByKey,
        (_state: AccountsRootState, _accountKey: AccountKey, tokenContract?: TokenAddress) =>
            tokenContract,
    ],
    (account, tokenContract): AccountItem | undefined => {
        if (!account) return undefined;

        return {
            symbol: account.symbol,
            backendType: account.backendType,
            descriptor: account.descriptor,
            accountKey: account.key,
            identity: tryGetAccountIdentity(account),
            hideMainAccount: !!tokenContract,
            // Pass empty array to show only the main account, or the token to show only its graph.
            tokensFilter: tokenContract ? [tokenContract] : [],
        };
    },
    {
        memoizeOptions: {
            // Account objects churn on every blockchain sync, but the graph fetch input uses
            // only stable account identity fields. Keep the same object ref when they are equal.
            resultEqualityCheck: deepEqual,
        },
    },
);

export const selectAssetTabOfAccountToken = (
    state: TokensRootState & FiatRatesRootState & WalletSettingsRootState,
    accountKey: AccountKey,
    tokenContract: TokenAddress,
): AccountOverviewTab => {
    const lcContract = tokenContract.toLowerCase();

    const defiTokens = selectAccountDefiTokens(state, accountKey);
    if (defiTokens.some(t => t.contract.toLowerCase() === lcContract)) return 'defi';

    const hiddenTokens = selectAccountManuallyHiddenTokens(state, accountKey);
    const unrecognizedTokens = selectAccountUnrecognizedTokens(state, accountKey);
    if ([...hiddenTokens, ...unrecognizedTokens].some(t => t.contract.toLowerCase() === lcContract))
        return 'hidden';

    return 'tokens';
};

export const selectHasAccountOrTokenSpendableBalance = (
    state: AccountsRootState & TokensRootState,
    accountKey: AccountKey,
    tokenContract?: TokenAddress,
): boolean => {
    const account = selectAccountByKey(state, accountKey);

    return hasAccountOrTokenSpendableBalance({ account, tokenContract });
};
