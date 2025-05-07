import { FirmwareHashCheckError, FirmwareRevisionCheckError } from '@trezor/connect';
import { FilterPropertiesByType } from '@trezor/type-utils';

/*
 * Various scenarios how firmware authenticity check errors are handled in Suite
 * see suite-native/device/src/config/firmware.ts for Suite Lite
 */

type BehaviorBaseType = {
    shouldReport: boolean; // whether to report the check result to Sentry
    isConclusive: boolean; // result is considered final, not expected to change when check is rerun
};

// will be ignored completely
type SkippedBehavior = BehaviorBaseType & { type: 'skipped' };
// display a warning banner
type SoftWarningBehavior = BehaviorBaseType & { type: 'softWarning' };
// display "Device Compromised" modal, after closing it display a warning banner, block receiving address
type HardModalBehavior = BehaviorBaseType & { type: 'hardModal'; shouldReport: true };

type RevisionErrorBehavior = SoftWarningBehavior | HardModalBehavior;
type RevisionCheckErrorScenarios = Record<FirmwareRevisionCheckError, RevisionErrorBehavior>;

type HashErrorBehavior = SkippedBehavior | HardModalBehavior;
type HashCheckErrorScenarios = Record<FirmwareHashCheckError, HashErrorBehavior>;

export const revisionCheckErrorScenarios = {
    'revision-mismatch': { type: 'hardModal', shouldReport: true, isConclusive: true },
    'firmware-version-unknown': { type: 'hardModal', shouldReport: true, isConclusive: true },
    'cannot-perform-check-offline': {
        type: 'softWarning',
        shouldReport: false,
        isConclusive: false,
    },
    'other-error': { type: 'softWarning', shouldReport: true, isConclusive: false },
} satisfies RevisionCheckErrorScenarios;

export const hashCheckErrorScenarios = {
    'hash-mismatch': { type: 'hardModal', shouldReport: true, isConclusive: true },
    'check-skipped': { type: 'skipped', shouldReport: false, isConclusive: false },
    'check-unsupported': { type: 'skipped', shouldReport: false, isConclusive: false },
    // could mean counterfeit firmware, but it's also caught by revision check, which handles edge-cases better
    'unknown-release': { type: 'skipped', shouldReport: false, isConclusive: true },
    'other-error': { type: 'hardModal', shouldReport: true, isConclusive: false },
} satisfies HashCheckErrorScenarios;

export type SkippedHashCheckError = keyof FilterPropertiesByType<
    typeof hashCheckErrorScenarios,
    { type: 'skipped' }
>;

export const isSkippedHashCheckError = (
    error: FirmwareHashCheckError,
): error is SkippedHashCheckError => hashCheckErrorScenarios[error].type === 'skipped';
