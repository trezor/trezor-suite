import { createWeakMapSelector } from '@suite-common/redux-utils';
import {
    type TokenDefinitionsRootState,
    selectTokenDefinitions,
} from '@suite-common/token-definitions';
import { type TokenAddress, type TokenInfoBranded } from '@suite-common/wallet-types';
import { getFiatRateKey, isErc4626, toFiatCurrency } from '@suite-common/wallet-utils';

import { type GetTokensOutputType, getTokens } from './tokenUtils';
import { type AccountsRootState } from '../accounts/accountsReducer';
import { selectAccountByKey } from '../accounts/accountsSelectors';
import { selectCurrentFiatRates } from '../fiat-rates/fiatRatesSelectors';
import { type FiatRatesRootState } from '../fiat-rates/fiatRatesTypes';
import {
    type WalletSettingsRootState,
    selectBaseCurrency,
} from '../settings/walletSettingsReducer';

export type TokensRootState = AccountsRootState &
    TokenDefinitionsRootState &
    FiatRatesRootState &
    WalletSettingsRootState;

const createMemoizedSelector = createWeakMapSelector.withTypes<TokensRootState>();

export const selectAccountTokens = createMemoizedSelector(
    [selectAccountByKey, selectTokenDefinitions],
    (account, tokenDefinitions): GetTokensOutputType | null => {
        if (!account) return null;

        return getTokens({
            tokens: account.tokens ?? [],
            symbol: account.symbol,
            tokenDefinitions: tokenDefinitions[account.symbol]?.coin,
        });
    },
);

export const selectAccountHiddenTokens = createMemoizedSelector(
    [selectAccountTokens],
    (tokenCategories): TokenInfoBranded[] => {
        if (!tokenCategories) return [];

        const {
            hiddenWithBalance,
            hiddenWithoutBalance,
            unverifiedWithBalance,
            unverifiedWithoutBalance,
        } = tokenCategories;

        return [
            ...hiddenWithBalance,
            ...hiddenWithoutBalance,
            ...unverifiedWithBalance,
            ...unverifiedWithoutBalance,
        ] as TokenInfoBranded[];
    },
);

export const selectAccountManuallyHiddenTokens = createMemoizedSelector(
    [selectAccountTokens],
    (tokenCategories): TokenInfoBranded[] => {
        if (!tokenCategories) return [];

        return (
            [
                ...tokenCategories.hiddenWithBalance,
                ...tokenCategories.hiddenWithoutBalance,
            ] as TokenInfoBranded[]
        ).sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
    },
);

export const selectAccountUnrecognizedTokens = createMemoizedSelector(
    [selectAccountTokens],
    (tokenCategories): TokenInfoBranded[] => {
        if (!tokenCategories) return [];

        return (
            [
                ...tokenCategories.unverifiedWithBalance,
                ...tokenCategories.unverifiedWithoutBalance,
            ] as TokenInfoBranded[]
        ).sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
    },
);

export const selectAccountManuallyHiddenTokensCount = createMemoizedSelector(
    [selectAccountManuallyHiddenTokens],
    (tokens): number => tokens.length,
);

export const selectAccountDefiTokens = createMemoizedSelector(
    [selectAccountTokens, selectAccountByKey, selectCurrentFiatRates, selectBaseCurrency],
    (tokenCategories, account, fiatRates, localCurrency): TokenInfoBranded[] => {
        if (!tokenCategories || !account) return [];

        const getTokenFiatValue = (token: { contract: string; balance?: string }): number => {
            if (!fiatRates || !localCurrency) return 0;
            const fiatRateKey = getFiatRateKey(
                account.symbol,
                localCurrency,
                token.contract as TokenAddress,
            );
            const rate = fiatRates[fiatRateKey]?.rate;
            if (!rate || !token.balance) return 0;

            return toFiatCurrency({ amount: token.balance, rate })?.toNumber() ?? 0;
        };

        return (tokenCategories.shownWithBalance.filter(isErc4626) as TokenInfoBranded[]).sort(
            (a, b) => getTokenFiatValue(b) - getTokenFiatValue(a),
        );
    },
);

export const selectAccountDefiTokensCount = createMemoizedSelector(
    [selectAccountDefiTokens],
    (defiTokens): number => defiTokens.length,
);
