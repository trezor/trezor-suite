import { type MutationOptions, desktopMutationKeys, useMutation } from '@suite-common/react-query';

import {
    type GetYieldResponseError,
    type GetYieldsResponseSuccess,
    type ProviderDto,
    type YieldsControllerGetYieldsSort,
    type YieldsControllerGetYieldsType,
    getYields,
} from '../api';

interface GetYieldOpportunitiesVariables {
    offset?: number;
    limit?: number;
    sort?: YieldsControllerGetYieldsSort;
}

export interface UseGetYieldOpportunitiesProps {
    /**
     * @url https://docs.yield.xyz/reference/providerscontroller_getproviders
     */
    providers?: ProviderDto['id'][];

    types?: YieldsControllerGetYieldsType[];

    onSuccess?: MutationOptions<
        GetYieldsResponseSuccess,
        Error,
        GetYieldOpportunitiesVariables
    >['onSuccess'];
    onError?: MutationOptions<
        GetYieldResponseError,
        Error,
        GetYieldOpportunitiesVariables
    >['onError'];
}

/**
 * Paginated list of Yield opportunities
 * @url https://docs.yield.xyz/reference/yieldscontroller_getyields
 */
export function useGetYieldOpportunities({
    providers = ['morpho'],
    types = ['vault'],
    onError,
    onSuccess,
}: UseGetYieldOpportunitiesProps) {
    return useMutation<GetYieldsResponseSuccess, Error, GetYieldOpportunitiesVariables>({
        mutationKey: desktopMutationKeys.getYieldOpportunities,
        mutationFn: ({ offset = 0, limit = 20, sort = 'statusEnterDesc' }) =>
            getYields({
                offset,
                limit,
                providers,
                types,
                sort,
            }),
        onError,
        onSuccess: (data, variables, onMutateResult, context) =>
            onSuccess?.(data, variables, onMutateResult, context),
    });
}
