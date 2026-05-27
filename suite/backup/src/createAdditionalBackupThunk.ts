import { type AdditionalBackupResult, createAdditionalBackup } from '@suite-common/backup';
import { createThunk } from '@suite-common/redux-utils';
import { type DeviceUniquePath, PROTO } from '@trezor/connect';

import { actionPrefix } from './constants';

export type { AdditionalBackupResult };

export const createAdditionalBackupThunk = createThunk(
    `${actionPrefix}/createAdditionalBackupThunk`,
    (
        {
            devicePath,
            onVerificationComplete,
        }: { devicePath: DeviceUniquePath; onVerificationComplete?: () => void },
        _thunkApi,
    ) =>
        createAdditionalBackup({
            devicePath,
            backupMethod: PROTO.BackupMethod.N4W1,
            onVerificationComplete,
        }),
);
