import { FirmwareHashCheckError, FirmwareRevisionCheckError } from '../types';

export const HASH_CHECK_MAX_ATTEMPTS = 3;

export const HASH_CHECK_RETRIABLE_ERRORS = ['other-error'] satisfies FirmwareHashCheckError[];
export const REVISION_CHECK_RETRIABLE_ERRORS = [
    'cannot-perform-check-offline',
    'other-error',
] satisfies FirmwareRevisionCheckError[];
