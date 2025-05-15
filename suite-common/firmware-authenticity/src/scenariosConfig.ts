import {
    FirmwareHashCheckError,
    FirmwareHashCheckTimeouts,
    FirmwareRevisionCheckError,
} from '@trezor/connect';
import { DeviceModelInternal } from '@trezor/device-utils';
import type { FilterPropertiesByType } from '@trezor/type-utils';

/*
 * Various scenarios how firmware authenticity check errors are handled in Suite and Suite Lite
 */

type BehaviorBaseType = {
    shouldReport: boolean; // whether to report the check result to Sentry
    isConclusive: boolean; // result is considered final, not expected to change when check is rerun
    shouldNotify: boolean; // whether to do one-time toast notification
};

// no permanent UI, and no restriction of access to device
type SkippedBehavior = BehaviorBaseType & { type: 'skipped' };
// display a warning banner
type SoftWarningBehavior = BehaviorBaseType & { type: 'softWarning' };
// display "Device Compromised" modal, after closing it display a warning banner, block receiving address
type HardModalBehavior = BehaviorBaseType & { type: 'hardModal'; shouldReport: true };

type RevisionErrorBehavior = SkippedBehavior | SoftWarningBehavior | HardModalBehavior;
type RevisionCheckErrorScenarios = Record<FirmwareRevisionCheckError, RevisionErrorBehavior>;

type HashErrorBehavior = SkippedBehavior | HardModalBehavior;
type HashCheckErrorScenarios = Record<FirmwareHashCheckError, HashErrorBehavior>;

export const revisionCheckErrorScenarios = {
    'revision-mismatch': {
        type: 'hardModal',
        shouldReport: true,
        shouldNotify: false,
        isConclusive: true,
    },
    'firmware-version-unknown': {
        type: 'hardModal',
        shouldReport: true,
        shouldNotify: false,
        isConclusive: true,
    },
    // Note that in native, a banner is displayed, but with special handling, see useIsOfflineBannerVisible
    'cannot-perform-check-offline': {
        type: 'softWarning',
        shouldReport: false,
        shouldNotify: false,
        isConclusive: false,
    },
    'other-error': {
        type: 'skipped',
        shouldReport: true,
        shouldNotify: true,
        isConclusive: false,
    },
} satisfies RevisionCheckErrorScenarios;

export const hashCheckErrorScenarios = {
    'hash-mismatch': {
        type: 'hardModal',
        shouldReport: true,
        shouldNotify: false,
        isConclusive: true,
    },
    'takes-too-long': {
        type: 'hardModal',
        shouldReport: true,
        shouldNotify: false,
        isConclusive: false,
    },
    'check-skipped': {
        type: 'skipped',
        shouldReport: false,
        shouldNotify: false,
        isConclusive: false,
    },
    'check-unsupported': {
        type: 'skipped',
        shouldReport: false,
        shouldNotify: false,
        isConclusive: false,
    },
    // could mean counterfeit firmware, but it's also caught by revision check, which handles edge-cases better
    'unknown-release': {
        type: 'skipped',
        shouldReport: false,
        shouldNotify: false,
        isConclusive: true,
    },
    'other-error': {
        type: 'hardModal',
        shouldReport: true,
        shouldNotify: false,
        isConclusive: false,
    },
} satisfies HashCheckErrorScenarios;

// TODO: when this is moved to suite-common, extract the following derived types & typeguards to a new file
export type SkippedRevisionCheckError = keyof FilterPropertiesByType<
    typeof revisionCheckErrorScenarios,
    { type: 'skipped' }
>;

export const isSkippedRevisionCheckError = (
    error: FirmwareRevisionCheckError,
): error is SkippedRevisionCheckError => revisionCheckErrorScenarios[error].type === 'skipped';

export type SkippedHashCheckError = keyof FilterPropertiesByType<
    typeof hashCheckErrorScenarios,
    { type: 'skipped' }
>;

export const isSkippedHashCheckError = (
    error: FirmwareHashCheckError,
): error is SkippedHashCheckError => hashCheckErrorScenarios[error].type === 'skipped';

// stricter type than required by @trezor/connect, which is very permissive, being a library
type ExhaustiveFirmwareHashCheckTimeouts = FirmwareHashCheckTimeouts &
    Record<DeviceModelInternal, number | undefined>;

export const FW_HASH_CHECK_DEFAULT_TIMEOUTS: ExhaustiveFirmwareHashCheckTimeouts = {
    [DeviceModelInternal.T1B1]: 1500,
    [DeviceModelInternal.T2T1]: undefined,
    [DeviceModelInternal.T2B1]: undefined,
    [DeviceModelInternal.T3B1]: undefined,
    [DeviceModelInternal.T3T1]: undefined,
    [DeviceModelInternal.T3W1]: undefined,
    [DeviceModelInternal.UNKNOWN]: undefined,
};

export type RevisionCheckErrorWithNotification = keyof FilterPropertiesByType<
    typeof revisionCheckErrorScenarios,
    { shouldNotify: true }
>;

export const isRevisionCheckErrorWithNotification = (
    error: FirmwareRevisionCheckError,
): error is RevisionCheckErrorWithNotification =>
    revisionCheckErrorScenarios[error].shouldNotify === true;

export type HashCheckErrorWithNotification = keyof FilterPropertiesByType<
    typeof hashCheckErrorScenarios,
    { shouldNotify: true }
>;

export const isHashCheckErrorWithNotification = (
    error: FirmwareHashCheckError,
): error is HashCheckErrorWithNotification =>
    // @ts-expect-error if this no longer gives error, then TODO hash check notifications must be implemented
    hashCheckErrorScenarios[error].shouldNotify === true;
