import { useMemo } from 'react';
import { useThrottle } from 'react-use';

import { selectSelectedDevice } from '@suite-common/device';
import { useSelector } from '@suite-common/redux-utils';
import { selectAccountsWithSuiteSyncLabel } from '@suite-common/suite-sync';
import { selectAllAccountsToList } from '@suite-common/wallet-core';

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

    return useMemo(() => throttledAccounts.map(account => ({ account })), [throttledAccounts]);
}

export type AccountOption = ReturnType<typeof useAccountsOptions>[number];
