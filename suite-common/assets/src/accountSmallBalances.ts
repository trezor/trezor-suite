import { selectBaseCurrency, selectCurrentFiatRates } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { getFiatRateKey, isPositiveBalance, toFiatCurrency } from '@suite-common/wallet-utils';
import { createWeakMapSelector } from '@trezor/redux-utils';
import { type BigNumber } from '@trezor/utils';

import {
    getAccountListSectionAmount,
    getAccountListSectionKey,
    selectAccountListSectionsWithVaultTokens,
} from './accountListSections';
import { type AssetTableState, selectSmallBalanceFiatThreshold } from './homeAssetTableSelectors';
import {
    type SmallBalanceSummary,
    haveSameSmallBalanceSummary,
    summarizeSmallBalances,
} from './smallBalances';

const createMemoizedSelector = createWeakMapSelector.withTypes<AssetTableState>();

export type AccountSmallBalances = {
    /** The keys of the sections worth under a dollar, as `getAccountListSectionKey` gives them. */
    keys: ReadonlySet<string>;
    summary: SmallBalanceSummary | undefined;
};

// Rebuilt on every rate update, so a rebuild that lands on the same small balances is thrown away
// and the table does not re-render for nothing.
const haveSameAccountSmallBalances = (left: AccountSmallBalances, right: AccountSmallBalances) =>
    left.keys.size === right.keys.size &&
    [...left.keys].every(key => right.keys.has(key)) &&
    haveSameSmallBalanceSummary(left.summary, right.summary);

export const selectAccountSmallBalances = createMemoizedSelector(
    [
        (state: AssetTableState, accountKey: AccountKey) =>
            selectAccountListSectionsWithVaultTokens(state, accountKey),
        selectCurrentFiatRates,
        selectBaseCurrency,
        (state: AssetTableState) => selectSmallBalanceFiatThreshold(state),
    ],
    (sections, rates, baseCurrency, threshold): AccountSmallBalances => {
        const keys = new Set<string>();
        const fiatValues: BigNumber[] = [];

        if (threshold !== undefined) {
            sections.forEach(section => {
                if (section.type === 'account') {
                    return;
                }

                const held = getAccountListSectionAmount(section);

                if (held === undefined || !isPositiveBalance(held.amount)) {
                    return;
                }

                const rate =
                    rates?.[getFiatRateKey(section.account.symbol, baseCurrency, held.tokenAddress)]
                        ?.rate;
                const value =
                    rate === undefined ? null : toFiatCurrency({ amount: held.amount, rate });

                if (value?.lt(threshold)) {
                    keys.add(getAccountListSectionKey(section));
                    fiatValues.push(value);
                }
            });
        }

        return { keys, summary: summarizeSmallBalances(fiatValues) };
    },
    { memoizeOptions: { resultEqualityCheck: haveSameAccountSmallBalances } },
);
