import type {
    QuotaManagerCommunicationFailedErrType,
    WriteModeRequiredForAllocationErrType,
} from '@suite-common/suite-sync-types';

export const WriteModeRequiredForAllocation = (): WriteModeRequiredForAllocationErrType => ({
    type: 'WriteModeRequiredForAllocation',
});

export const QuotaManagerCommunicationFailed = (
    caused: unknown,
): QuotaManagerCommunicationFailedErrType => ({
    type: 'QuotaManagerCommunicationFailed',
    caused,
});
