import { computeConfirmMissingBackup } from '../computeConfirmMissingBackup';

describe('computeConfirmMissingBackup', () => {
    it('returns false when no batch wants to display on device', () => {
        expect(
            computeConfirmMissingBackup([
                { showOnTrezor: false, suppressBackupWarning: undefined },
                { showOnTrezor: undefined, suppressBackupWarning: undefined },
            ]),
        ).toBe(false);
    });

    it('returns true when a batch wants to display and does not suppress', () => {
        expect(
            computeConfirmMissingBackup([{ showOnTrezor: true, suppressBackupWarning: undefined }]),
        ).toBe(true);
    });

    it('returns false when every batch that displays also suppresses', () => {
        expect(
            computeConfirmMissingBackup([
                { showOnTrezor: true, suppressBackupWarning: true },
                { showOnTrezor: false, suppressBackupWarning: undefined },
            ]),
        ).toBe(false);
    });

    it('returns true if at least one displaying batch does not suppress', () => {
        expect(
            computeConfirmMissingBackup([
                { showOnTrezor: true, suppressBackupWarning: true },
                { showOnTrezor: true, suppressBackupWarning: false },
            ]),
        ).toBe(true);
    });

    it('returns false for empty input', () => {
        expect(computeConfirmMissingBackup([])).toBe(false);
    });
});
