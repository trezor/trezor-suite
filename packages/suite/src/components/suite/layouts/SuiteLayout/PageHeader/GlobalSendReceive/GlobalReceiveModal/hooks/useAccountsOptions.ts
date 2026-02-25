import { useMemo } from 'react';
import { useThrottle } from 'react-use';

import { selectSelectedDevice } from '@suite-common/device';
import { selectAccountsWithSuiteSyncLabel } from '@suite-common/suite-sync';
import { selectAllAccountsToList } from '@suite-common/wallet-core';
import { sortByCoin } from '@suite-common/wallet-utils';

import { ASSET_ROW_HEIGHT } from 'src/components/suite/asset-picker/constants';
import { useSelector } from 'src/hooks/suite';

export function useAccountsOptions() {
    const baseAccounts = useSelector(selectAllAccountsToList);
    const device = useSelector(selectSelectedDevice);

    const accounts = useSelector(state =>
        selectAccountsWithSuiteSyncLabel(
            state,
            baseAccounts,
            device?.state?.staticSessionId ?? null,
        ),
    );

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
