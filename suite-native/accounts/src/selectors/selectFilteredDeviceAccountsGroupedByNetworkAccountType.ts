import { pipe } from '@mobily/ts-belt';

import { GroupedByTypeAccounts } from '../types';
import {
    filterAccountsByLabelAndNetworkNames,
    filterSendAvailableAccounts,
    groupAccountsByNetworkAccountType,
    sortAccountsByNetworksAndAccountTypes,
} from '../utils';
import { NativeAccountsRootState, createMemoizedSelector } from './common';
import { selectVisibleAccountsWithLabel } from './selectVisibleAccountsWithLabel';

// TODO: It searches for filterValue even in tokens without fiat rates.
// These are currently hidden in UI, but they should be made accessible in some way.
export const selectFilteredDeviceAccountsGroupedByNetworkAccountType = createMemoizedSelector(
    [
        selectVisibleAccountsWithLabel,
        (_state: NativeAccountsRootState, filterValue: string) => filterValue,
        (
            _state: NativeAccountsRootState,
            _filterValue: string,
            isSendFilterEnabled: boolean = false,
        ) => isSendFilterEnabled,
    ],
    (accounts, filterValue, isSendFilterEnabled) => {
        const sortedAccounts = sortAccountsByNetworksAndAccountTypes(accounts);
        const sendFilteredAccounts = isSendFilterEnabled
            ? filterSendAvailableAccounts(sortedAccounts)
            : sortedAccounts;

        return pipe(
            sendFilteredAccounts,
            accountsSorted => filterAccountsByLabelAndNetworkNames(accountsSorted, filterValue),
            groupAccountsByNetworkAccountType,
        ) as GroupedByTypeAccounts;
    },
);
