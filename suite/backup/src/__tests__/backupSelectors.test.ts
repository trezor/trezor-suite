import type { DeviceRootState } from '@suite-common/device';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import type { BackupAvailability } from '@trezor/protobuf/src/definitions';

import { type BackupState } from '../backupReducer';
import { type BackupRootState, selectBackupStatus } from '../backupSelectors';

type TestState = BackupRootState & DeviceRootState;

describe('selectBackupStatus', () => {
    const baseBackup: BackupState = {
        userConfirmed: [],
        inProgress: false,
        error: undefined,
    };

    const errorBackup: BackupState = {
        userConfirmed: [],
        inProgress: false,
        error: 'error message',
    };

    const inProgressBackup: BackupState = {
        userConfirmed: [],
        inProgress: true,
        error: undefined,
    };

    const createState = (
        backup: BackupState,
        backup_availability: BackupAvailability,
    ): TestState => ({
        backup: { ...baseBackup, ...backup },
        device: {
            devices: [],
            persistentDeviceData: [],
            selectedDevice: mockSuiteDevice({}, { backup_availability }),
        },
    });

    it('returns "finished" if backup_availability is Available and no error is set', () => {
        [baseBackup, inProgressBackup].forEach(backup => {
            const state = createState(backup, 'Available');
            expect(selectBackupStatus(state)).toBe('finished');
        });
    });

    it('returns "finished" if backup_availability is NotAvailable and no error is set', () => {
        [baseBackup, inProgressBackup].forEach(backup => {
            const state = createState(backup, 'NotAvailable');
            expect(selectBackupStatus(state)).toBe('finished');
        });
    });

    it('returns "error" if backup.error is set even when availability indicates finished', () => {
        (['Available', 'NotAvailable'] as const).forEach(availability => {
            const state = createState(errorBackup, availability);
            expect(selectBackupStatus(state)).toBe('error');
        });
    });

    it('returns "error" if backup.error is set', () => {
        const state = createState(errorBackup, 'Required');
        expect(selectBackupStatus(state)).toBe('error');
    });

    it('returns "in-progress" if backup.inProgress is true', () => {
        const state = createState(inProgressBackup, 'Required');
        expect(selectBackupStatus(state)).toBe('in-progress');
    });

    it('returns "initial" if none of the above', () => {
        const state = createState(baseBackup, 'Required');
        expect(selectBackupStatus(state)).toBe('initial');
    });
});
