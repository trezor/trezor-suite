import {
    type MetadataRootState,
    selectIsLegacyLabelingVisible,
    selectLabelingDataForAccount,
} from '@suite/metadata';
import { type MessageSystemRootState } from '@suite-common/message-system';
import { createWeakMapSelector } from '@suite-common/redux-utils';
import {
    type SuiteSyncDataRootState,
    type WithSuiteSyncAndDeviceState,
    selectIsSuiteSyncEnabled,
    selectSuiteSyncAccountLabel,
} from '@suite-common/suite-sync';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import type { AccountDescriptor, AccountKey } from '@suite-common/wallet-types';
import { isAccountWatchOnly } from '@suite-common/wallet-utils';
import { type StaticSessionId } from '@trezor/connect';
import { parseStaticSessionId } from '@trezor/device-utils';

type SelectAccountLabelParams = {
    accountDescriptor: AccountDescriptor;
    accountKey: AccountKey;
    deviceStaticId: StaticSessionId;
    networkSymbol: NetworkSymbol;
};

export type SelectAccountLabelState = MetadataRootState &
    AccountsRootState &
    WithSuiteSyncAndDeviceState &
    MessageSystemRootState &
    SuiteSyncDataRootState;

const createMemoizedSelector = createWeakMapSelector.withTypes<SelectAccountLabelState>();

export const selectAccountLabel = createMemoizedSelector(
    [
        selectIsLegacyLabelingVisible,
        (state: SelectAccountLabelState, { accountKey }: SelectAccountLabelParams) =>
            selectLabelingDataForAccount(state, accountKey),
        selectIsSuiteSyncEnabled,
        (
            state: SelectAccountLabelState,
            { deviceStaticId, accountDescriptor, networkSymbol }: SelectAccountLabelParams,
        ) => {
            const { walletDescriptor } = parseStaticSessionId(deviceStaticId);

            return selectSuiteSyncAccountLabel(
                state,
                walletDescriptor,
                accountDescriptor,
                networkSymbol,
            );
        },
        (state: SelectAccountLabelState, { accountKey }: SelectAccountLabelParams) =>
            selectAccountByKey(state, accountKey),
    ],
    (
        isLegacyLabelingVisible,
        { accountLabel: legacyAccountLabel },
        isSuiteSyncEnabled,
        suiteSyncAccountLabel,
        account,
    ): string | null => {
        const localAccountLabel =
            account && isAccountWatchOnly(account) ? account.accountLabel : undefined;

        if (isSuiteSyncEnabled) {
            return suiteSyncAccountLabel ?? localAccountLabel ?? null;
        }

        return (
            (isLegacyLabelingVisible ? legacyAccountLabel : undefined) ?? localAccountLabel ?? null
        );
    },
);
