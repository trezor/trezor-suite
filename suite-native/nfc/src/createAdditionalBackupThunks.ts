import {
    type CreateAdditionalBackupResult,
    createAdditionalBackup,
} from '@suite-common/backup';
import { selectSelectedDevice } from '@suite-common/device';
import { createThunk } from '@suite-common/redux-utils';
import { selectIsAdditionalShamirBackupInProgress } from '@suite-native/backup';
import { requestPrioritizedDeviceAccess } from '@suite-native/device-mutex';

const CREATE_ADDITIONAL_BACKUP_MODULE_PREFIX = 'createAdditionalBackup';

export const createAdditionalBackupThunk = createThunk<
    CreateAdditionalBackupResult,
    void,
    { rejectValue: string }
>(
    `${CREATE_ADDITIONAL_BACKUP_MODULE_PREFIX}/createAdditionalBackup`,
    async (_, { getState, rejectWithValue }) => {
        const device = selectSelectedDevice(getState());

        if (!device?.features) {
            return rejectWithValue('Device not found');
        }

        const isAlreadyInBackupMode = selectIsAdditionalShamirBackupInProgress(getState());

        const mutexResponse = await requestPrioritizedDeviceAccess(() =>
            createAdditionalBackup({
                devicePath: device.path,
                isAdditionalShamirBackupInProgress: isAlreadyInBackupMode,
            }),
        );

        if (!mutexResponse.success) {
            return rejectWithValue(mutexResponse.error);
        }

        return mutexResponse.payload;
    },
);
