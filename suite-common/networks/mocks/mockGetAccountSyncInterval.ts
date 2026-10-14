import { mock } from '@trezor/dependency-injection';
import { DEFAULT_ACCOUNT_SYNC_INTERVAL } from '@trezor/network-module-suite-common-types';

import type { GetAccountSyncInterval } from '../src/createGetAccountSyncInterval';

export const mockGetAccountSyncInterval = (interval = DEFAULT_ACCOUNT_SYNC_INTERVAL) =>
    mock<GetAccountSyncInterval>(() => interval);
