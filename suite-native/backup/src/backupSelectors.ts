import {
    hasExtendableShamirBackup as getHasExtendableShamirBackup,
    isAdditionalShamirBackupInProgress,
} from '@suite-common/backup';
import {
    type DeviceRootState,
    selectDeviceFeatures,
    selectDeviceModel,
} from '@suite-common/device';
import { createWeakMapSelector } from '@suite-common/redux-utils';
import { DeviceModelInternal } from '@trezor/device-utils';

const createMemoizedSelector = createWeakMapSelector.withTypes<DeviceRootState>();

export const selectIsAdditionalShamirBackupInProgress = createMemoizedSelector(
    [selectDeviceFeatures],
    features => features !== undefined && isAdditionalShamirBackupInProgress(features),
);

export const selectHasExtendableShamirBackup = createMemoizedSelector(
    [selectDeviceFeatures],
    features => features !== undefined && getHasExtendableShamirBackup(features),
);

export const selectIsCreateAdditionalBackupAvailable = createMemoizedSelector(
    [selectDeviceModel, selectHasExtendableShamirBackup, selectDeviceFeatures],
    (deviceModel, hasExtendableShamirBackup, features) =>
        deviceModel === DeviceModelInternal.T3W1 && // NOTE: FW will expose a capability flag for this, so it should be replaced with that than
        hasExtendableShamirBackup &&
        features?.backup_availability === 'NotAvailable',
);
