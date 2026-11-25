import {
    type StakingRootState,
    selectStakingAccountAmountOutsideBalance,
} from '@suite-common/earn-staking';
import { type TokenDefinitionsRootState } from '@suite-common/token-definitions';
import {
    type AccountsRootState,
    type FiatRatesRootState,
    type WalletSettingsRootState,
    selectAccountByKey,
    selectAccountTokens,
    selectBaseCurrency,
    selectCurrentFiatRates,
} from '@suite-common/wallet-core';
import {
    type AccountKey,
    areBaseCurrencyAmountsEqual,
    asBaseCurrencyAmount,
} from '@suite-common/wallet-types';
import { BASE_CURRENCY_ZERO, getAccountFiatBalance } from '@suite-common/wallet-utils';
import { createWeakMapSelector } from '@trezor/redux-utils';

export type AccountFiatBalanceRootState = AccountsRootState &
    FiatRatesRootState &
    WalletSettingsRootState &
    TokenDefinitionsRootState &
    StakingRootState;

const createMemoizedSelector = createWeakMapSelector.withTypes<AccountFiatBalanceRootState>();

/** What the account is worth: its coin with its stake counted in, and the tokens it shows. */
export const selectAccountFiatBalance = createMemoizedSelector(
    [
        selectCurrentFiatRates,
        selectAccountByKey,
        selectAccountTokens,
        selectBaseCurrency,
        selectStakingAccountAmountOutsideBalance,
        (_, _accountKey: AccountKey, shouldIncludeTokens?: boolean) => shouldIncludeTokens ?? true,
    ],
    (fiatRates, account, tokenCategories, localCurrency, stakingBalance, shouldIncludeTokens) => {
        if (!account) {
            return BASE_CURRENCY_ZERO;
        }

        const totalBalance = getAccountFiatBalance({
            account: { ...account, tokens: tokenCategories?.shownWithBalance ?? [] },
            rates: fiatRates,
            baseCurrencyCode: localCurrency,
            stakingBalance,
            shouldIncludeTokens,
        });

        return totalBalance ? asBaseCurrencyAmount(totalBalance) : BASE_CURRENCY_ZERO;
    },
    {
        memoizeOptions: {
            // Accounts and fiat rates churn on every sync; keep the previous BigNumber reference
            // when the amount is unchanged so useSelector consumers don't rerender.
            resultEqualityCheck: areBaseCurrencyAmountsEqual,
        },
    },
);
