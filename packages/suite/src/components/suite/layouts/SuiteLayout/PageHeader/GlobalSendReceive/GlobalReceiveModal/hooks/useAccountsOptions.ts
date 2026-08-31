import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useThrottle } from 'react-use';

import { selectSelectedDevice } from '@suite-common/device';
import { selectAccountsWithSuiteSyncLabel } from '@suite-common/suite-sync';
import { selectAllAccountsToList } from '@suite-common/wallet-core';

import { type AppState } from 'src/types/suite';

export function useAccountsOptions() {
    const baseAccounts = useSelector(selectAllAccountsToList);
    const device = useSelector(selectSelectedDevice);

    const accounts = useSelector((state: AppState) =>
        selectAccountsWithSuiteSyncLabel(
            state,
            baseAccounts,
            device?.state?.staticSessionId ?? null,
        ),
    );

    const throttledAccounts = useThrottle(accounts, 1000);

    return useMemo(() => throttledAccounts.map(account => ({ account })), [throttledAccounts]);
}

export type AccountOption = ReturnType<typeof useAccountsOptions>[number];
