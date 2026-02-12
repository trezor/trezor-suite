import { selectSelectedDevice } from '@suite-common/device';
import { createThunk } from '@suite-common/redux-utils';
import { requestPrioritizedDeviceAccess } from '@suite-native/device-mutex';
import TrezorConnect from '@trezor/connect';

const CHECK_BACKUP_MODULE_PREFIX = 'checkBackup';

export const checkBackupThunk = createThunk(
    `${CHECK_BACKUP_MODULE_PREFIX}/checkDeviceBackup`,
    async (_, { getState }) => {
        const device = selectSelectedDevice(getState());

        if (!device?.features) throw new Error('Device is not ready for check backup.');

        const mutexResponse = await requestPrioritizedDeviceAccess(() =>
            TrezorConnect.recoveryDevice({
                type: 'DryRun',
                device: {
                    path: device.path,
                },
            }),
        );

        if (!mutexResponse.success) throw new Error(mutexResponse.error);

        const connectResponse = mutexResponse.payload;

        if (!connectResponse.success) {
            // TODO: failure analytics (https://github.com/trezor/trezor-suite/issues/19846)
        } else {
            // TODO: success analytics (https://github.com/trezor/trezor-suite/issues/19846)
        }

        return connectResponse;
    },
);
