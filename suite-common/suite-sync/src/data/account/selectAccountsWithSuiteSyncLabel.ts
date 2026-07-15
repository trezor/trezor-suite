import { type DeviceRootState, selectDeviceStaticSessionId } from '@suite-common/device';
import { createWeakMapSelector, weakMapMemoize } from '@suite-common/redux-utils';
import { type SuiteSyncAccount } from '@suite-common/suite-sync-storage';
import { type AccountsRootState, selectVisibleDeviceAccounts } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { type StaticSessionId } from '@trezor/connect';

import { type SuiteSyncDataRootState } from '../suiteSyncDataReducer';
import { findSuiteSyncAccountLabel } from './findSuiteSyncAccountLabel';
import { selectSuiteSyncAccounts } from './selectSuiteSyncAccounts';

export type AccountWithSuiteSyncLabel = Account & {
    label: string | null;
};

const createMemoizedSelector = createWeakMapSelector.withTypes<SuiteSyncDataRootState>();
const createVisibleDeviceAccountsSelector = createWeakMapSelector.withTypes<
    SuiteSyncDataRootState & AccountsRootState & DeviceRootState
>();

const createAccountWithSuiteSyncLabel = weakMapMemoize(
    (account: Account, label: string | null): AccountWithSuiteSyncLabel => ({ ...account, label }),
);

const mapAccountsToSuiteSyncLabel = (
    accounts: readonly Account[],
    suiteSyncAccountLabels: SuiteSyncAccount[],
): AccountWithSuiteSyncLabel[] =>
    accounts.map(account => {
        const label =
            findSuiteSyncAccountLabel({
                accounts: suiteSyncAccountLabels,
                accountDescriptor: account.descriptor,
                networkSymbol: account.symbol,
            })?.label ?? null;

        return createAccountWithSuiteSyncLabel(account, label);
    });

export const selectAccountsWithSuiteSyncLabel = createMemoizedSelector(
    [
        (_state: SuiteSyncDataRootState, accounts: readonly Account[]) => accounts,
        (
            state: SuiteSyncDataRootState,
            _accounts: readonly Account[],
            deviceStaticSessionId: StaticSessionId | null,
        ) => selectSuiteSyncAccounts(state, deviceStaticSessionId),
    ],
    mapAccountsToSuiteSyncLabel,
);

export const selectVisibleDeviceAccountsWithSuiteSyncLabel = createVisibleDeviceAccountsSelector(
    [
        selectVisibleDeviceAccounts,
        state => selectSuiteSyncAccounts(state, selectDeviceStaticSessionId(state)),
    ],
    mapAccountsToSuiteSyncLabel,
);
