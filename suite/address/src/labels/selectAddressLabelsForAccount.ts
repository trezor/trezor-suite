import {
    type LegacyLabelingVisibleRootState,
    selectIsLegacyLabelingVisible,
    selectLabelingDataForAccount,
} from '@suite/metadata';
import { type MessageSystemRootState } from '@suite-common/message-system';
import { createWeakMapSelector } from '@suite-common/redux-utils';
import {
    type SuiteSyncDataRootState,
    type WithSuiteSyncAndDeviceState,
    selectIsSuiteSyncEnabled,
    selectSuiteSyncAddressLabels,
} from '@suite-common/suite-sync';
import { type AccountsRootState } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { type StaticSessionId } from '@trezor/connect';

type SelectAddressLabelsForAccountParams = {
    addresses: string[];
    accountKey: AccountKey;
    deviceStaticId: StaticSessionId;
};

export type SelectAddressLabelsForAccountState = LegacyLabelingVisibleRootState &
    AccountsRootState &
    WithSuiteSyncAndDeviceState &
    MessageSystemRootState &
    SuiteSyncDataRootState;

const createMemoizedSelector =
    createWeakMapSelector.withTypes<SelectAddressLabelsForAccountState>();

type LabelsMap = Record<string, string | null>;

export const selectAddressLabelsForAccount = createMemoizedSelector(
    [
        selectIsLegacyLabelingVisible,
        (
            state: SelectAddressLabelsForAccountState,
            { accountKey }: SelectAddressLabelsForAccountParams,
        ) => selectLabelingDataForAccount(state, accountKey),
        selectIsSuiteSyncEnabled,
        (
            state: SelectAddressLabelsForAccountState,
            { deviceStaticId }: SelectAddressLabelsForAccountParams,
        ) => selectSuiteSyncAddressLabels(state, deviceStaticId),
        (
            _state: SelectAddressLabelsForAccountState,
            { addresses }: SelectAddressLabelsForAccountParams,
        ) => addresses,
    ],
    (
        isLegacyLabelingVisible,
        { addressLabels },
        isSuiteSyncEnabled,
        suiteSyncAddressLabels,
        addresses,
    ): LabelsMap => {
        if (isSuiteSyncEnabled) {
            const suiteSyncAddressLabelsMap = suiteSyncAddressLabels.reduce<LabelsMap>(
                (acc, item) => {
                    acc[item.address] = item.label ?? null;

                    return acc;
                },
                {},
            );

            return addresses.reduce<LabelsMap>((acc, address) => {
                acc[address] = suiteSyncAddressLabelsMap[address] ?? null;

                return acc;
            }, {});
        }

        if (isLegacyLabelingVisible) {
            return addresses.reduce<LabelsMap>((acc, address) => {
                acc[address] = addressLabels[address] ?? null;

                return acc;
            }, {});
        }

        return addresses.reduce<LabelsMap>((acc, address) => {
            acc[address] = null;

            return acc;
        }, {});
    },
);
