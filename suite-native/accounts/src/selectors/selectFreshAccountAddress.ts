import {
    selectAccountByKey,
    selectIsAccountUtxoBased,
    selectPendingAccountAddresses,
} from '@suite-common/wallet-core';
import { getFirstFreshAddress } from '@suite-common/wallet-utils';

import { createMemoizedSelector } from './common';

export const selectFreshAccountAddress = createMemoizedSelector(
    [selectAccountByKey, selectPendingAccountAddresses, selectIsAccountUtxoBased],
    (account, pendingAddresses, isAccountUtxoBased) =>
        account ? getFirstFreshAddress(account, [], pendingAddresses, isAccountUtxoBased) : null,
);
