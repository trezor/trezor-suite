export type WriteModeRequiredForAllocationErrType = {
    type: 'WriteModeRequiredForAllocation';
};

/**
 * Communication with Quota Manager failed (bad URL, network error, ...)
 */
export type QuotaManagerCommunicationFailedErrType = {
    type: 'QuotaManagerCommunicationFailed';
    caused: unknown;
};
