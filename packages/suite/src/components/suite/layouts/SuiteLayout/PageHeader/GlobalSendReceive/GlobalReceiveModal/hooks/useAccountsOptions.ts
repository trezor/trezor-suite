import { useMemo, useRef } from 'react';

import {
    selectAllAccountsToList,
    selectBaseCurrency,
    selectCurrentFiatRates,
} from '@suite-common/wallet-core';
import { accountsFiatBalanceInDescOrderComparator } from '@suite-common/wallet-utils';

import { ASSET_ROW_ACCOUNT_HEIGHT } from 'src/components/suite/asset-picker/components';
import { useSelector } from 'src/hooks/suite';

export function useAccountsOptions() {
    const accounts = useSelector(selectAllAccountsToList);
    const fiatRates = useSelector(selectCurrentFiatRates);
    const fiatRagesRef = useRef(fiatRates);

    const baseCurrencyCode = useSelector(selectBaseCurrency);

    return useMemo(() => {
        const fiatRates = fiatRagesRef.current;

        if (!fiatRates) {
            return [];
        }

        return accounts
            .toSorted(function sortByFiatBalanceInDescOrder(accountA, accountB) {
                return accountsFiatBalanceInDescOrderComparator({
                    accountA,
                    accountB,
                    baseCurrencyCode,
                    fiatRates,
                });
            })
            .map(account => ({
                account,
                height: ASSET_ROW_ACCOUNT_HEIGHT,
            }));
    }, [accounts, baseCurrencyCode]);
}

export type AccountOption = ReturnType<typeof useAccountsOptions>[number];
