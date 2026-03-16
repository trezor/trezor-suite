import { getSuiteVersion } from '@trezor/env-utils';
import { versionUtils } from '@trezor/utils';

import {
    type UpdateStatus,
    type UpdateStatusDevice,
    type UpdateStatusSuite,
} from './updateQuickActionTypes';
import { useDevice, useSelector } from '../../../../../../../hooks/suite';
import {
    type DesktopUpdateState,
    UpdateState,
    selectDesktopUpdate,
} from '../../../../../../../reducers/suite/desktopUpdateReducer';

type UpdateStatusData = {
    updateStatus: UpdateStatus;
    updateStatusDevice: UpdateStatusDevice;
    updateStatusSuite: UpdateStatusSuite;
};

type GetSuiteUpdateStatusArgs = {
    desktopUpdate: DesktopUpdateState;
};

const getSuiteUpdateStatus = ({ desktopUpdate }: GetSuiteUpdateStatusArgs): UpdateStatusSuite => {
    const isSuiteJustUpdated = desktopUpdate.firstRunAfterUpdate;

    if (isSuiteJustUpdated && !desktopUpdate.justUpdatedInteractedWith) {
        return 'just-updated';
    }

    // We don't show update-availability in case of auto-updates until the update is downloaded
    if (desktopUpdate.isAutomaticUpdateEnabled && desktopUpdate.state === UpdateState.Ready) {
        return 'update-downloaded-auto-restart-to-update';
    }

    if (!desktopUpdate.isAutomaticUpdateEnabled) {
        const isUpdateAvailable = [UpdateState.Available, UpdateState.Downloading].includes(
            desktopUpdate.state,
        );
        if (isUpdateAvailable) {
            return 'update-available';
        }

        if (desktopUpdate.state === UpdateState.Ready) {
            return 'update-downloaded-manual';
        }
    }

    return 'up-to-date';
};

type GetDeviceStatusParams = {
    isDeviceDisconnected: boolean;
    isSuiteUpdateInProgress: boolean;
    isFirmwareOutdated: boolean;
};

const getDeviceStatus = ({
    isDeviceDisconnected,
    isSuiteUpdateInProgress,
    isFirmwareOutdated,
}: GetDeviceStatusParams): UpdateStatusDevice => {
    if (isDeviceDisconnected) {
        return 'disconnected';
    }

    if (isFirmwareOutdated && !isSuiteUpdateInProgress) {
        return 'update-available';
    }

    return 'up-to-date';
};

export const useUpdateStatus = (): UpdateStatusData => {
    const { device } = useDevice();
    const desktopUpdate = useSelector(selectDesktopUpdate);

    const isDeviceDisconnected = device?.connected !== true;

    // If firmware is outdated and suite update download/check is in progress,
    // we suppress the Firmware notification as it can be there just for a second and then
    // it will be replaced with Suite update notification
    const isSuiteUpdateInProgress = [UpdateState.Downloading, UpdateState.Checking].includes(
        desktopUpdate.state,
    );

    const { releaseConditions: { environment, shouldBeOffered } = {} } =
        device?.firmwareReleaseConfigInfo || {};

    // when device is not connected environment?.min_suite_version is undefined and when you start the process of flashing
    // firmware since it reboots from Firmware mode to Bootloader mode there is a moment when device is "disconnected"
    // and therefore that fails, so we evaluate isNewerOrEqual only if device is not disconnected.
    const isValidSuiteVersion =
        !isDeviceDisconnected &&
        !!environment?.min_suite_version &&
        versionUtils.isNewerOrEqual(getSuiteVersion(), environment?.min_suite_version);

    const isFirmwareOutdated =
        isValidSuiteVersion && !!shouldBeOffered && device?.firmware === 'outdated';

    const updateStatusSuite = getSuiteUpdateStatus({ desktopUpdate });

    const updateStatusDevice = getDeviceStatus({
        isDeviceDisconnected,
        isSuiteUpdateInProgress,
        isFirmwareOutdated,
    });

    const common: Omit<UpdateStatusData, 'updateStatus'> = {
        updateStatusDevice,
        updateStatusSuite,
    };

    if (
        common.updateStatusSuite === 'update-downloaded-auto-restart-to-update' ||
        common.updateStatusSuite === 'update-downloaded-manual'
    ) {
        return { updateStatus: common.updateStatusSuite, ...common };
    }

    if (
        common.updateStatusSuite === 'update-available' ||
        common.updateStatusDevice === 'update-available'
    ) {
        return { updateStatus: 'update-available', ...common };
    }

    if (common.updateStatusSuite === 'just-updated') {
        return { updateStatus: 'just-updated', ...common };
    }

    return { updateStatus: 'up-to-date', ...common };
};
