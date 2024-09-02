import { useDevice, useSelector } from '../../../../../../../hooks/suite';
import {
    DesktopUpdateState,
    UpdateState,
} from '../../../../../../../reducers/suite/desktopUpdateReducer';
import { UpdateStatus } from './updateQuickActionTypes';

type UpdateStatusData = {
    updateStatus: UpdateStatus;
    updateStatusDevice: UpdateStatus;
    updateStatusSuite: UpdateStatus;
};

const getSuiteUpdateStatus = ({ desktopUpdate }: { desktopUpdate: DesktopUpdateState }) => {
    const isSuiteJustUpdated = desktopUpdate.firstRunAfterUpdate;

    const isSuiteOutdated = [UpdateState.Available, UpdateState.Downloading].includes(
        desktopUpdate.state,
    );

    const isSuiteRestartRequired = desktopUpdate.state === UpdateState.Ready;

    if (isSuiteRestartRequired) {
        return 'restart-to-update';
    }

    if (isSuiteOutdated) {
        return 'update-available';
    }

    return isSuiteJustUpdated ? 'just-updated' : 'up-to-date';
};

export const useUpdateStatus = (): UpdateStatusData => {
    const { device } = useDevice();
    const { desktopUpdate } = useSelector(state => state);

    const isFirmwareOutdated = device?.firmware === 'outdated';

    const common: Omit<UpdateStatusData, 'updateStatus'> = {
        updateStatusDevice: isFirmwareOutdated ? 'update-available' : 'up-to-date',
        updateStatusSuite: getSuiteUpdateStatus({ desktopUpdate }),
    };

    if (common.updateStatusSuite === 'restart-to-update') {
        return { updateStatus: 'restart-to-update', ...common };
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
