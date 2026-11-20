import {
    type GetStakingOperationAvailabilityParams,
    getStakingOperationAvailability,
} from './getStakingOperationAvailability';

export type IsStakingOperationAvailableParams = GetStakingOperationAvailabilityParams;

export const isStakingOperationAvailable = (params: IsStakingOperationAvailableParams): boolean =>
    getStakingOperationAvailability(params) === 'available';
