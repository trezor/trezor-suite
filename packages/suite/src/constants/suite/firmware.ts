import { FirmwareHashCheckError, FirmwareRevisionCheckError } from '@trezor/connect';

// These errors will be treated softly, with only a warning displayed instead of modal
// note: there are no skipped revision check errors
export const softRevisionCheckErrors = [
    'cannot-perform-check-offline',
    'other-error',
] satisfies FirmwareRevisionCheckError[];

// These errors are omitted entirely
// note: there are no soft hash check errors
export const skippedHashCheckErrors = [
    'check-skipped',
    'check-unsupported',
    // this could be serious, but it's also caught by revision check, which handles edge-cases better, so it's skipped here
    'unknown-release',
] satisfies FirmwareHashCheckError[];

// Of those skipped errors, these ones should nevertheless be reported to Sentry
type SkippedHashCheckErrors = typeof skippedHashCheckErrors;
export const skippedButReportedHashCheckErrors = [] satisfies SkippedHashCheckErrors;
