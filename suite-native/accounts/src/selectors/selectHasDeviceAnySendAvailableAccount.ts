import { A, pipe } from '@mobily/ts-belt';

import { selectIsPortfolioTrackerDevice } from '@suite-common/device';
import { selectVisibleDeviceAccounts } from '@suite-common/wallet-core';

import { filterSendAvailableAccounts } from '../utils';
import { createMemoizedSelector } from './common';

export const selectHasDeviceAnySendAvailableAccount = createMemoizedSelector(
    [selectIsPortfolioTrackerDevice, selectVisibleDeviceAccounts],
    (isPortfolioTrackerDevice, accounts) => {
        if (isPortfolioTrackerDevice) return false;

        return pipe(accounts, filterSendAvailableAccounts, A.isNotEmpty);
    },
);
