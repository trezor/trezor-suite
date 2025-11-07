import { useMemo, useRef } from 'react';

import {
    selectAllAccountsToList,
    selectBaseCurrency,
    selectCurrentFiatRates,
} from '@suite-common/wallet-core';
import { asBaseCurrencyAmount, getAccountFiatBalance } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import { ASSET_ROW_HEIGHTS } from 'src/components/suite/asset-picker/constants';
import { useSelector } from 'src/hooks/suite';

export function useAccountsOptions() {
    const accounts = useSelector(selectAllAccountsToList);
    const fiatRates = useSelector(selectCurrentFiatRates);
    const fiatRagesRef = useRef(fiatRates);

    const baseCurrencyCode = useSelector(selectBaseCurrency);

    return useMemo(
        () =>
            accounts
                .map(account => {
                    const accountFiatBalance =
                        getAccountFiatBalance({
                            account,
                            baseCurrencyCode,
                            rates: fiatRagesRef.current,
                            shouldIncludeTokens: false,
                            shouldIncludeStaking: false,
                        }) ?? new BigNumber(0);

                    return {
                        accountFiatBalance: asBaseCurrencyAmount(accountFiatBalance),
                        account,
                    };
                })
                .toSorted(function sortByFiatBalanceInDescOrder(itemA, itemB) {
                    if (itemB.accountFiatBalance.gt(itemA.accountFiatBalance)) {
                        return 1;
                    }

                    if (itemA.accountFiatBalance.gt(itemB.accountFiatBalance)) {
                        return -1;
                    }

                    return 0;
                })
                .map(({ account }) => ({
                    account,
                    height: ASSET_ROW_HEIGHTS['account'],
                })),
        [accounts, baseCurrencyCode],
    );
}

export type AccountOption = ReturnType<typeof useAccountsOptions>[number];
