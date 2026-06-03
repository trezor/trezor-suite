import {
    type MetadataRootState,
    selectIsLegacyLabelingVisible,
    selectLabelingDataForWallet,
} from '@suite/metadata';
import { type MessageSystemRootState } from '@suite-common/message-system';
import { createWeakMapSelector } from '@suite-common/redux-utils';
import {
    type SuiteSyncDataRootState,
    type WithSuiteSyncAndDeviceState,
    selectIsSuiteSyncEnabled,
    selectSuiteSyncWalletLabel,
} from '@suite-common/suite-sync';
import { type StaticSessionId } from '@trezor/connect';
import { parseStaticSessionId } from '@trezor/device-utils';

type SelectWalletLabelParams = {
    deviceStaticId: StaticSessionId | null;
};

export type SelectWalletLabelState = MetadataRootState &
    WithSuiteSyncAndDeviceState &
    MessageSystemRootState &
    SuiteSyncDataRootState;

const createMemoizedSelector = createWeakMapSelector.withTypes<SelectWalletLabelState>();

export const selectWalletLabel = createMemoizedSelector(
    [
        selectIsLegacyLabelingVisible,
        (state: SelectWalletLabelState, { deviceStaticId }: SelectWalletLabelParams) =>
            selectLabelingDataForWallet(state, deviceStaticId ?? undefined).walletLabel,
        selectIsSuiteSyncEnabled,
        (state: SelectWalletLabelState, { deviceStaticId }: SelectWalletLabelParams) => {
            if (deviceStaticId === null) {
                return null;
            }

            const { walletDescriptor } = parseStaticSessionId(deviceStaticId);

            return selectSuiteSyncWalletLabel(state, walletDescriptor);
        },
    ],
    (isLegacyLabelingVisible, legacyWalletLabel, isSuiteSyncEnabled, suiteSyncWalletLabel) => {
        if (isSuiteSyncEnabled) {
            return suiteSyncWalletLabel;
        }

        if (!isLegacyLabelingVisible) {
            return null;
        }

        return legacyWalletLabel === undefined || legacyWalletLabel.trim() === ''
            ? null
            : legacyWalletLabel;
    },
);
