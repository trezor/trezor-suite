import { FirmwareHashCheckError, FirmwareRevisionCheckError } from '@trezor/connect';
import type { FilterPropertiesByType } from '@trezor/type-utils';

import { hashCheckErrorScenarios, revisionCheckErrorScenarios } from './scenariosConfig';

export const isHardRevisionCheckError = (error: FirmwareRevisionCheckError | null) =>
    error !== null && revisionCheckErrorScenarios[error].type === 'hardModal';

export const isHardHashCheckError = (error: FirmwareHashCheckError | null) =>
    error !== null && hashCheckErrorScenarios[error].type === 'hardModal';

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
