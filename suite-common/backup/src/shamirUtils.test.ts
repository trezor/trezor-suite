import { type PROTO } from '@trezor/connect';

import {
    doesSupportMultiShare,
    hasExtendableShamirBackup,
    isAdditionalShamirBackupInProgress,
} from './shamirUtils';

const makeFeatures = (overrides: Partial<PROTO.Features> = {}): PROTO.Features =>
    ({
        backup_type: undefined,
        backup_availability: undefined,
        recovery_status: undefined,
        recovery_type: undefined,
        capabilities: [],
        ...overrides,
    }) as unknown as PROTO.Features;

describe(hasExtendableShamirBackup.name, () => {
    it('returns true for Slip39_Single_Extendable', () => {
        expect(
            hasExtendableShamirBackup(makeFeatures({ backup_type: 'Slip39_Single_Extendable' })),
        ).toBe(true);
    });

    it('returns true for Slip39_Basic_Extendable', () => {
        expect(
            hasExtendableShamirBackup(makeFeatures({ backup_type: 'Slip39_Basic_Extendable' })),
        ).toBe(true);
    });

    it('returns true for Slip39_Advanced_Extendable', () => {
        expect(
            hasExtendableShamirBackup(makeFeatures({ backup_type: 'Slip39_Advanced_Extendable' })),
        ).toBe(true);
    });

    it('returns false for Bip39', () => {
        expect(hasExtendableShamirBackup(makeFeatures({ backup_type: 'Bip39' }))).toBe(false);
    });

    it('returns false for non-extendable Slip39_Basic', () => {
        expect(hasExtendableShamirBackup(makeFeatures({ backup_type: 'Slip39_Basic' }))).toBe(
            false,
        );
    });

    it('returns false when backup_type is null', () => {
        expect(hasExtendableShamirBackup(makeFeatures({ backup_type: null as any }))).toBe(false);
    });

    it('returns false when backup_type is undefined', () => {
        expect(hasExtendableShamirBackup(makeFeatures({ backup_type: undefined }))).toBe(false);
    });
});

describe(doesSupportMultiShare.name, () => {
    it('returns true when device has Capability_Shamir and extendable backup', () => {
        expect(
            doesSupportMultiShare(
                makeFeatures({
                    capabilities: ['Capability_Shamir'],
                    backup_type: 'Slip39_Basic_Extendable',
                }),
            ),
        ).toBe(true);
    });

    it('returns false when device lacks Capability_Shamir', () => {
        expect(
            doesSupportMultiShare(
                makeFeatures({
                    capabilities: [],
                    backup_type: 'Slip39_Basic_Extendable',
                }),
            ),
        ).toBe(false);
    });

    it('returns false when device has Capability_Shamir but non-extendable backup', () => {
        expect(
            doesSupportMultiShare(
                makeFeatures({
                    capabilities: ['Capability_Shamir'],
                    backup_type: 'Bip39',
                }),
            ),
        ).toBe(false);
    });

    it('returns false when capabilities is undefined', () => {
        expect(
            doesSupportMultiShare(
                makeFeatures({
                    capabilities: undefined,
                    backup_type: 'Slip39_Basic_Extendable',
                }),
            ),
        ).toBe(false);
    });
});

describe(isAdditionalShamirBackupInProgress.name, () => {
    it('returns true when in backup recovery with available backup', () => {
        expect(
            isAdditionalShamirBackupInProgress(
                makeFeatures({
                    recovery_status: 'Backup',
                    recovery_type: undefined,
                    backup_availability: 'Available',
                }),
            ),
        ).toBe(true);
    });

    it('returns false when recovery_status is not Backup', () => {
        expect(
            isAdditionalShamirBackupInProgress(
                makeFeatures({
                    recovery_status: 'Recovery',
                    recovery_type: undefined,
                    backup_availability: 'Available',
                }),
            ),
        ).toBe(false);
    });

    it('returns false when recovery_type is set', () => {
        expect(
            isAdditionalShamirBackupInProgress(
                makeFeatures({
                    recovery_status: 'Backup',
                    recovery_type: 'DryRun' as any,
                    backup_availability: 'Available',
                }),
            ),
        ).toBe(false);
    });

    it('returns false when backup is not available', () => {
        expect(
            isAdditionalShamirBackupInProgress(
                makeFeatures({
                    recovery_status: 'Backup',
                    recovery_type: undefined,
                    backup_availability: 'NotAvailable',
                }),
            ),
        ).toBe(false);
    });
});
