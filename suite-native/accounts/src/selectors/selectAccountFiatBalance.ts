import {
    selectAccountByKey,
    selectBaseCurrency,
    selectCurrentFiatRates,
} from '@suite-common/wallet-core';
import { AccountKey } from '@suite-common/wallet-types';
import { BASE_CURRENCY_ZERO, getAccountFiatBalance } from '@suite-common/wallet-utils';

import { createMemoizedSelector } from './common';

export const selectAccountFiatBalance = createMemoizedSelector(
    [
        selectCurrentFiatRates,
        selectAccountByKey,
        selectBaseCurrency,
        (_, _accountKey: AccountKey, shouldIncludeStaking?: boolean) =>
            shouldIncludeStaking ?? true,
        (
            _,
            _accountKey: AccountKey,
            _shouldIncludeStaking?: boolean,
            shouldIncludeTokens?: boolean,
        ) => shouldIncludeTokens ?? true,
    ],
    (fiatRates, account, localCurrency, shouldIncludeStaking, shouldIncludeTokens) => {
        if (!account) {
            return BASE_CURRENCY_ZERO;
        }

        const totalBalance = getAccountFiatBalance({
            account,
            rates: fiatRates,
            baseCurrencyCode: localCurrency,
            shouldIncludeStaking,
            shouldIncludeTokens,
        });

        if (!totalBalance) {
            return BASE_CURRENCY_ZERO;
        }

        return totalBalance;
    },
);
