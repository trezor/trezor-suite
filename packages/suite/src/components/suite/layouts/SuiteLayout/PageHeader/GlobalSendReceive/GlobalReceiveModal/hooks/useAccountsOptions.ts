import { useMemo } from 'react';
import { useThrottle } from 'react-use';

import { selectAllAccountsToList, selectCurrentFiatRates } from '@suite-common/wallet-core';
import { sortByCoin } from '@suite-common/wallet-utils';
import { useCurrentRef } from '@trezor/react-utils';

import { ASSET_ROW_ACCOUNT_HEIGHT } from 'src/components/suite/asset-picker/components';
import { useSelector } from 'src/hooks/suite';

export function useAccountsOptions() {
    const accounts = useSelector(selectAllAccountsToList);
    const fiatRates = useSelector(selectCurrentFiatRates);
    const fiatRatesRef = useCurrentRef(fiatRates);
    const throttledAccounts = useThrottle(accounts, 500);

    return useMemo(() => {
        const fiatRates = fiatRatesRef.current;

        if (!fiatRates) {
            return [];
        }

        return sortByCoin(throttledAccounts).map(account => ({
            account,
            height: ASSET_ROW_ACCOUNT_HEIGHT,
        }));
    }, [throttledAccounts, fiatRatesRef]);
}

export type AccountOption = ReturnType<typeof useAccountsOptions>[number];
