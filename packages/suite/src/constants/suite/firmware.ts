import { FirmwareHashCheckError, FirmwareRevisionCheckError } from '@trezor/connect';

export const skippedRevisionCheckErrors = [
    'cannot-perform-check-offline',
    'other-error',
] satisfies FirmwareRevisionCheckError[];

export const skippedHashCheckErrors = [
    'check-skipped',
    'check-unsupported',
    // this could be serious, but it's also caught by revision check, which handles edge-cases better, so it's skipped here
    'unknown-release',
] satisfies FirmwareHashCheckError[];
