import { FirmwareHashCheckError, FirmwareRevisionCheckError } from '../types';

// given that firmware hash is a security feature, we prefer to hardcode the version rather than to query the device capabilities
// (a counterfeit device could simply declare it's incapable of hash check)
export const FW_HASH_SUPPORTED_VERSIONS = ['1.11.1', '2.5.1'];

export const HASH_CHECK_MAX_ATTEMPTS = 3;

export const HASH_CHECK_RETRIABLE_ERRORS = ['other-error'] satisfies FirmwareHashCheckError[];
export const REVISION_CHECK_RETRIABLE_ERRORS = [
    'cannot-perform-check-offline',
    'other-error',
] satisfies FirmwareRevisionCheckError[];
