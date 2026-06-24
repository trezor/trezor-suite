import { type AccountKey } from '@suite-common/wallet-types';
import { createKeyedThrottle } from '@trezor/utils';

// Refresh the selected account on enter, at most once per this interval per account.
export const ACCOUNT_REFRESH_INTERVAL = 10_000;

export const createAccountRefreshThrottle = () =>
    createKeyedThrottle<AccountKey>(ACCOUNT_REFRESH_INTERVAL);
