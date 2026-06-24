import { type Account } from '@suite-common/wallet-types';
import { createKeyedThrottle } from '@trezor/utils';

import {
    type AccountsRefreshTimeRootState,
    selectAccountRefreshTime,
} from './accountsRefreshTimeReducer';

// Refresh the selected account on enter, at most once per this interval per account.
export const MIN_ACCOUNT_REFRESH_INTERVAL = 10_000;

// The throttle reads the per-account timestamp from the store (accountsRefreshTime slice) rather
// than keeping its own map, so there is a single source of truth.
export const createAccountRefreshThrottle = (getState: () => AccountsRefreshTimeRootState) =>
    createKeyedThrottle<Account['key']>(MIN_ACCOUNT_REFRESH_INTERVAL, accountKey =>
        selectAccountRefreshTime(getState(), accountKey),
    );
