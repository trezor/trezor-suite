import { type YieldDtoV2, useAllYieldOpportunities } from '@suite-common/earn-stablecoin-api';
import { returnStableArrayIfEmpty } from '@suite-common/redux-utils';

type UseYieldOpportunitiesData = Pick<
    ReturnType<typeof useAllYieldOpportunities>,
    'isLoading' | 'isError' | 'refetch'
> & {
    yieldOpportunities: YieldDtoV2[];
};

export const useYieldOpportunities = (): UseYieldOpportunitiesData => {
    const { data, isLoading, isError, refetch } = useAllYieldOpportunities();
    const yieldOpportunities = returnStableArrayIfEmpty(data);

    return { yieldOpportunities, isLoading, isError, refetch };
};
