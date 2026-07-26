import { createWeakMapSelector, returnStableArrayIfEmpty } from '@suite-common/redux-utils';
import { selectAllAccountsToList } from '@suite-common/wallet-core';
import { isAccountWatchOnly } from '@suite-common/wallet-utils';

import { type AppState } from 'src/types/suite';

const createMemoizedSelector = createWeakMapSelector.withTypes<AppState>();

export const selectAllOwnedAccountsToList = createMemoizedSelector(
    [selectAllAccountsToList],
    accounts => returnStableArrayIfEmpty(accounts.filter(account => !isAccountWatchOnly(account))),
);
