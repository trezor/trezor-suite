import { selectDeviceStaticSessionId } from '@suite-common/device';
import { selectAccountsWithSuiteSyncLabel } from '@suite-common/suite-sync';
import { selectVisibleDeviceAccounts } from '@suite-common/wallet-core';

import { NativeAccountsRootState, createMemoizedSelector } from './common';

export const selectVisibleAccountsWithLabel = createMemoizedSelector(
    [
        (state: NativeAccountsRootState) =>
            selectAccountsWithSuiteSyncLabel(
                state,
                selectVisibleDeviceAccounts(state),
                selectDeviceStaticSessionId(state),
            ),
    ],
    accounts => accounts,
);
