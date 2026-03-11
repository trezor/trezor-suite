import { AcquiredDevice } from '@suite-common/suite-types';
import { FirmwareHashCheckError, FirmwareRevisionCheckError } from '@trezor/connect';
import type { FilterPropertiesByType } from '@trezor/type-utils';

import { hashCheckErrorScenarios, revisionCheckErrorScenarios } from './scenariosConfig';

export const getIsHardRevisionCheckError = (error: FirmwareRevisionCheckError | null) =>
    error !== null && revisionCheckErrorScenarios[error].type === 'hardModal';

export const getIsHardHashCheckError = (error: FirmwareHashCheckError | null) =>
    error !== null && hashCheckErrorScenarios[error].type === 'hardModal';

export type SkippedRevisionCheckError = keyof FilterPropertiesByType<
    typeof revisionCheckErrorScenarios,
    { type: 'skipped' }
>;

export const getIsSkippedRevisionCheckError = (
    error: FirmwareRevisionCheckError,
): error is SkippedRevisionCheckError => revisionCheckErrorScenarios[error].type === 'skipped';

export type SkippedHashCheckError = keyof FilterPropertiesByType<
    typeof hashCheckErrorScenarios,
    { type: 'skipped' }
>;

export const getIsSkippedHashCheckError = (
    error: FirmwareHashCheckError,
): error is SkippedHashCheckError => hashCheckErrorScenarios[error].type === 'skipped';

export type RevisionCheckErrorWithNotification = keyof FilterPropertiesByType<
    typeof revisionCheckErrorScenarios,
    { shouldNotify: true }
>;

export const getIsRevisionCheckErrorWithNotification = (
    error: FirmwareRevisionCheckError,
): error is RevisionCheckErrorWithNotification =>
    revisionCheckErrorScenarios[error].shouldNotify === true;

export type HashCheckErrorWithNotification = keyof FilterPropertiesByType<
    typeof hashCheckErrorScenarios,
    { shouldNotify: true }
>;

export const getIsHashCheckErrorWithNotification = (
    error: FirmwareHashCheckError,
): error is HashCheckErrorWithNotification =>
    // @ts-expect-error if this no longer gives error, then TODO hash check notifications must be implemented
    hashCheckErrorScenarios[error].shouldNotify === true;

type AuthenticityChecks = AcquiredDevice['authenticityChecks'];

export const filterInconclusiveAuthenticityChecks = (
    checks: AuthenticityChecks,
): AuthenticityChecks => {
    let { firmwareRevision, firmwareHash } = checks;
    if (
        firmwareRevision &&
        !firmwareRevision.success &&
        revisionCheckErrorScenarios[firmwareRevision.error].isConclusive === false
    ) {
        firmwareRevision = null;
    }
    if (
        firmwareHash &&
        !firmwareHash.success &&
        hashCheckErrorScenarios[firmwareHash.error].isConclusive === false
    ) {
        firmwareHash = null;
    }

    return { firmwareRevision, firmwareHash };
};
