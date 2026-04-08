import { type MessageSystemRootState } from '@suite-common/message-system';
import { createWeakMapSelector, returnStableArrayIfEmpty } from '@suite-common/redux-utils';
import { type SuiteSyncAccount } from '@suite-common/suite-sync-storage';
import { type Account } from '@suite-common/wallet-types';
import { type StaticSessionId } from '@trezor/connect';

import {
    type WithSuiteSyncAndDeviceState,
    selectIsSuiteSyncEnabled,
} from '../../suiteSyncSelectors';
import { type SuiteSyncDataRootState } from '../suiteSyncDataReducer';
import { findSuiteSyncAccountLabel } from './findSuiteSyncAccountLabel';
import { selectSuiteSyncAccounts } from './selectSuiteSyncAccounts';

export type AccountWithSuiteSyncLabel = Account & {
    label: string | null;
};

type AccountsWithSuiteSyncLabelRootState = SuiteSyncDataRootState &
    WithSuiteSyncAndDeviceState &
    MessageSystemRootState;

const createMemoizedSelector =
    createWeakMapSelector.withTypes<AccountsWithSuiteSyncLabelRootState>();

const mapAccountsToSuiteSyncLabel = (
    accounts: readonly Account[],
    suiteSyncAccountLabels: SuiteSyncAccount[],
    isSuiteSyncEnabled: boolean,
): AccountWithSuiteSyncLabel[] =>
    returnStableArrayIfEmpty(
        accounts.map(account => ({
            ...account,
            label: isSuiteSyncEnabled
                ? (findSuiteSyncAccountLabel({
                      accounts: suiteSyncAccountLabels,
                      accountDescriptor: account.descriptor,
                      networkSymbol: account.symbol,
                  })?.label ?? null)
                : null,
        })),
    );

export const selectAccountsWithSuiteSyncLabel = createMemoizedSelector(
    [
        (_state: AccountsWithSuiteSyncLabelRootState, accounts: readonly Account[]) => accounts,
        (
            state: AccountsWithSuiteSyncLabelRootState,
            _accounts: readonly Account[],
            deviceStaticSessionId: StaticSessionId | null,
        ) => selectSuiteSyncAccounts(state, deviceStaticSessionId),
        selectIsSuiteSyncEnabled,
    ],
    mapAccountsToSuiteSyncLabel,
);
