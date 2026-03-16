import {
    selectAccountByKey,
    selectBaseCurrency,
    selectCurrentFiatRates,
} from '@suite-common/wallet-core';
import { BASE_CURRENCY_ZERO, getFiatRateKey, toFiatCurrency } from '@suite-common/wallet-utils';
import { selectAccountTokenInfo } from '@suite-native/tokens';

import { createMemoizedSelector } from './common';

export const selectAccountTokenFiatBalance = createMemoizedSelector(
    [selectCurrentFiatRates, selectBaseCurrency, selectAccountByKey, selectAccountTokenInfo],
    (fiatRates, localCurrency, account, tokenInfo) => {
        if (!account || !fiatRates || !tokenInfo) return BASE_CURRENCY_ZERO;
        const { contract, balance } = tokenInfo;
        const fiatRateKey = getFiatRateKey(account.symbol, localCurrency, contract);
        const rate = fiatRates[fiatRateKey]?.rate;

        if (!rate || !balance) return BASE_CURRENCY_ZERO;

        return toFiatCurrency({ amount: balance, rate }) ?? BASE_CURRENCY_ZERO;
    },
);
