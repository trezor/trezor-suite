import { type MutationOptions, desktopMutationKeys, useMutation } from '@suite-common/react-query';

import { type GetYieldsParams, type GetYieldsSort, type YieldsResponse } from '../api/types';
import { getYields } from '../services';

interface GetYieldOpportunitiesVariables {
    offset?: number;
    limit?: number;
    sort?: GetYieldsSort;
}

export interface UseGetYieldOpportunitiesProps {
    providers?: NonNullable<GetYieldsParams['providers']>;

    types?: NonNullable<GetYieldsParams['types']>;

    onSuccess?: MutationOptions<YieldsResponse, Error, GetYieldOpportunitiesVariables>['onSuccess'];
    onError?: MutationOptions<YieldsResponse, Error, GetYieldOpportunitiesVariables>['onError'];
}

/**
 * Paginated list of Yield opportunities
 */
export function useGetYieldOpportunities({
    providers = ['morpho'],
    types = ['vault'],
    onError,
    onSuccess,
}: UseGetYieldOpportunitiesProps) {
    return useMutation<YieldsResponse, Error, GetYieldOpportunitiesVariables>({
        mutationKey: desktopMutationKeys.getYieldOpportunities,
        mutationFn: ({ offset = 0, limit = 20, sort = 'statusEnterDesc' }) =>
            getYields({
                params: {
                    offset,
                    limit,
                    providers,
                    types,
                    sort,
                },
            }),
        onError,
        onSuccess: (data, variables, onMutateResult, context) =>
            onSuccess?.(data, variables, onMutateResult, context),
    });
}
