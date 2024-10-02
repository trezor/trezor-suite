import { useDevice, useSelector } from '../../../../../../../hooks/suite';
import {
    DesktopUpdateState,
    UpdateState,
} from '../../../../../../../reducers/suite/desktopUpdateReducer';
import { UpdateStatus, UpdateStatusSuite, UpdateStatusDevice } from './updateQuickActionTypes';

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

export const useUpdateStatus = (): UpdateStatusData => {
    const { device } = useDevice();
    const { desktopUpdate } = useSelector(state => state);

    const isFirmwareOutdated = device?.firmware === 'outdated';

    // If firmware is outdated and suite update download/check is in progress,
    // we suppress the Firmware notification as it can be there just for a second and then
    // it will be replaced with Suite update notification
    const isSuiteUpdateInProgress = [UpdateState.Downloading, UpdateState.Checking].includes(
        desktopUpdate.state,
    );

    const common: Omit<UpdateStatusData, 'updateStatus'> = {
        updateStatusDevice:
            isFirmwareOutdated && !isSuiteUpdateInProgress ? 'update-available' : 'up-to-date',
        updateStatusSuite: getSuiteUpdateStatus({ desktopUpdate }),
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
