import { useMemo } from 'react';
import { useThrottle } from 'react-use';

import { selectAllAccountsToList } from '@suite-common/wallet-core';
import { sortByCoin } from '@suite-common/wallet-utils';

import { ASSET_ROW_HEIGHT } from 'src/components/suite/asset-picker/constants';
import { useSelector } from 'src/hooks/suite';

export function useAccountsOptions() {
    const accounts = useSelector(selectAllAccountsToList);
    const throttledAccounts = useThrottle(accounts, 1000);

    return useMemo(
        () =>
            sortByCoin(throttledAccounts).map(account => ({
                account,
                height: ASSET_ROW_HEIGHT,
            })),
        [throttledAccounts],
    );
}

export type AccountOption = ReturnType<typeof useAccountsOptions>[number];
