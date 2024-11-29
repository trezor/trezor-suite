import { FirmwareHashCheckError, FirmwareRevisionCheckError } from '@trezor/connect';
import { FilterPropertiesByType } from '@trezor/type-utils';

/*
 * Various scenarios how firmware authenticity check errors are handled
 */

// will be ignored completely
type SkippedBehavior = { type: 'skipped'; shouldReport: boolean };
// display `SuiteBanners` warning
type SoftWarningBehavior = { type: 'softWarning'; shouldReport: true };
// display `SuiteBanners`, show `DeviceCompromised` modal, block receiving address
type HardModalBehavior = { type: 'hardModal'; shouldReport: true };

type RevisionErrorBehavior = SoftWarningBehavior | HardModalBehavior;
type RevisionCheckErrorScenarios = Record<FirmwareRevisionCheckError, RevisionErrorBehavior>;

type HashErrorBehavior = SkippedBehavior | HardModalBehavior;
type HashCheckErrorScenarios = Record<FirmwareHashCheckError, HashErrorBehavior>;

export const revisionCheckErrorScenarios = {
    'revision-mismatch': { type: 'hardModal', shouldReport: true },
    'firmware-version-unknown': { type: 'hardModal', shouldReport: true },
    'cannot-perform-check-offline': { type: 'softWarning', shouldReport: true },
    'other-error': { type: 'softWarning', shouldReport: true },
} satisfies RevisionCheckErrorScenarios;

export const hashCheckErrorScenarios = {
    'hash-mismatch': { type: 'hardModal', shouldReport: true },
    'check-skipped': { type: 'skipped', shouldReport: false },
    'check-unsupported': { type: 'skipped', shouldReport: false },
    // could mean counterfeit firmware, but it's also caught by revision check, which handles edge-cases better
    'unknown-release': { type: 'skipped', shouldReport: false },
    // TODO fix FW hash check unreliability & reenable
    'other-error': { type: 'skipped', shouldReport: true },
} satisfies HashCheckErrorScenarios;

export type SkippedHashCheckError = keyof FilterPropertiesByType<
    typeof hashCheckErrorScenarios,
    { type: 'skipped' }
>;

export const isSkippedHashCheckError = (
    error: FirmwareHashCheckError,
): error is SkippedHashCheckError => hashCheckErrorScenarios[error].type === 'skipped';
