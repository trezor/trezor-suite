import { useMemo } from 'react';
import { useThrottle } from 'react-use';

import { selectDeviceStaticSessionId } from '@suite-common/device';
import {
    type SuiteSyncDataRootState,
    selectAccountsWithSuiteSyncLabel,
} from '@suite-common/suite-sync';
import { selectAllAccountsToList } from '@suite-common/wallet-core';

import { useSelector } from '#src/hooks/suite';

export function useAccountsOptions() {
    const baseAccounts = useSelector(selectAllAccountsToList);
    const deviceStaticSessionId = useSelector(selectDeviceStaticSessionId);

    const accounts = useSelector((state: SuiteSyncDataRootState) =>
        selectAccountsWithSuiteSyncLabel(state, baseAccounts, deviceStaticSessionId),
    );

    const throttledAccounts = useThrottle(accounts, 1000);

    return useMemo(() => throttledAccounts.map(account => ({ account })), [throttledAccounts]);
}

export type AccountOption = ReturnType<typeof useAccountsOptions>[number];
