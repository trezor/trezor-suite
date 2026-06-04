import { type SelectedAccountRootState } from '@suite/account';
import {
    type LegacyLabelingVisibleRootState,
    selectIsLegacyLabelingVisible,
    selectLabelingDataForSelectedAccount,
} from '@suite/metadata';
import { type MessageSystemRootState } from '@suite-common/message-system';
import { createWeakMapSelector } from '@suite-common/redux-utils';
import {
    type SuiteSyncDataRootState,
    type WithSuiteSyncAndDeviceState,
    selectIsSuiteSyncEnabled,
    selectSuiteSyncAddressLabels,
} from '@suite-common/suite-sync';
import { type StaticSessionId } from '@trezor/connect';

type SelectAddressLabelParams = {
    address: string;
    deviceStaticId: StaticSessionId;
};

export type SelectAddressLabelState = LegacyLabelingVisibleRootState &
    SelectedAccountRootState &
    WithSuiteSyncAndDeviceState &
    MessageSystemRootState &
    SuiteSyncDataRootState;

const createMemoizedSelector = createWeakMapSelector.withTypes<SelectAddressLabelState>();

export const selectAddressLabel = createMemoizedSelector(
    [
        selectIsLegacyLabelingVisible,
        selectLabelingDataForSelectedAccount,
        selectIsSuiteSyncEnabled,
        (state: SelectAddressLabelState, { deviceStaticId }: SelectAddressLabelParams) =>
            selectSuiteSyncAddressLabels(state, deviceStaticId),
        (_state: SelectAddressLabelState, { address }: SelectAddressLabelParams) => address,
    ],
    (
        isLegacyLabelingVisible,
        { addressLabels },
        isSuiteSyncEnabled,
        suiteSyncAddressLabels,
        address,
    ): string | null => {
        if (isSuiteSyncEnabled) {
            return suiteSyncAddressLabels.find(item => item.address === address)?.label ?? null;
        }

        return isLegacyLabelingVisible ? (addressLabels[address] ?? null) : null;
    },
);
