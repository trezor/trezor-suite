import { createWeakMapSelector } from '@suite-common/redux-utils';
import { type SuiteSyncAccount } from '@suite-common/suite-sync-storage';
import { type Account } from '@suite-common/wallet-types';
import { type StaticSessionId } from '@trezor/connect';

import { type SuiteSyncDataRootState } from '../suiteSyncDataReducer';
import { findSuiteSyncAccountLabel } from './findSuiteSyncAccountLabel';
import { selectSuiteSyncAccounts } from './selectSuiteSyncAccounts';

export type AccountWithSuiteSyncLabel = Account & {
    label: string | null;
};

const createMemoizedSelector = createWeakMapSelector.withTypes<SuiteSyncDataRootState>();

const mapAccountsToSuiteSyncLabel = (
    accounts: readonly Account[],
    suiteSyncAccountLabels: SuiteSyncAccount[],
): AccountWithSuiteSyncLabel[] =>
    accounts.map(account => ({
        ...account,
        label:
            findSuiteSyncAccountLabel({
                accounts: suiteSyncAccountLabels,
                accountDescriptor: account.descriptor,
                networkSymbol: account.symbol,
            })?.label ??
            // account.accountLabel ??
            null,
    }));

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
