import { type BackupState, selectBackupStatus } from '@suite/backup';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { type BackupAvailability } from '@trezor/protobuf/src/messages';

import { type AppState } from 'src/reducers/store';
import { initialAppState } from 'src/support/tests/__fixtures__/defaultAppState';

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

    const getState = (backup: BackupState, backup_availability: BackupAvailability): AppState => ({
        ...initialAppState,
        backup: { ...baseBackup, ...backup },
        device: {
            devices: [],
            persistentDeviceData: [],
            isConnectionModalOpen: true,
            defaultConnectionMode: 'cable',
            selectedDevice: mockSuiteDevice({}, { backup_availability }),
        },
    });

    it('returns "finished" if backup_availability is Available and no error is set', () => {
        [baseBackup, inProgressBackup].forEach(backup => {
            const state = getState(backup, 'Available');
            expect(selectBackupStatus(state)).toBe('finished');
        });
    });

    it('returns "finished" if backup_availability is NotAvailable and no error is set', () => {
        [baseBackup, inProgressBackup].forEach(backup => {
            const state = getState(backup, 'NotAvailable');
            expect(selectBackupStatus(state)).toBe('finished');
        });
    });

    it('returns "error" if backup.error is set even when availability indicates finished', () => {
        ['Available', 'NotAvailable'].forEach(availability => {
            const state = getState(errorBackup, availability as BackupAvailability);
            expect(selectBackupStatus(state)).toBe('error');
        });
    });

    it('returns "error" if backup.error is set', () => {
        const state = getState(errorBackup, 'Required');
        expect(selectBackupStatus(state)).toBe('error');
    });

    it('returns "in-progress" if backup.inProgress is true', () => {
        const state = getState(inProgressBackup, 'Required');
        expect(selectBackupStatus(state)).toBe('in-progress');
    });

    it('returns "initial" if none of the above', () => {
        const state = getState(baseBackup, 'Required');
        expect(selectBackupStatus(state)).toBe('initial');
    });
});
