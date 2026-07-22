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
import { type AccountsRootState } from '@suite-common/wallet-core';
import type { AccountDescriptor, AccountKey } from '@suite-common/wallet-types';
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
    ],
    (
        isLegacyLabelingVisible,
        { accountLabel },
        isSuiteSyncEnabled,
        suiteSyncAccountLabel,
    ): string | null => {
        if (isSuiteSyncEnabled) {
            return suiteSyncAccountLabel ?? null;
        }

        return isLegacyLabelingVisible ? (accountLabel ?? null) : null;
    },
);
