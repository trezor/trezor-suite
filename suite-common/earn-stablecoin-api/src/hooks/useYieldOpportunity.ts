import { useMemo, useRef } from 'react';

import { type YieldDto } from '@suite-common/earn-stablecoin-defs';
import { commonQueryKeys, useQuery } from '@suite-common/react-query';

import { getYield } from '../services';

interface UseYieldOpportunityProps<T extends YieldDto[keyof YieldDto] | YieldDto = YieldDto> {
    select?: (yieldOpportunity: YieldDto) => T;
}

const defaultSelect = <T extends YieldDto[keyof YieldDto] | YieldDto = YieldDto>(
    yieldOpportunity: YieldDto,
): T => yieldOpportunity as T;

export function useYieldOpportunity<T extends YieldDto[keyof YieldDto] | YieldDto = YieldDto>(
    vaultId: string | undefined,
    { select = defaultSelect }: UseYieldOpportunityProps<T> = {},
) {
    const queryResult = useQuery({
        enabled: Boolean(vaultId),
        queryKey: commonQueryKeys.yieldOpportunities(vaultId),
        queryFn: ({ signal }) =>
            getYield({
                routeParams: { vaultId: vaultId! },
                signal,
            }),
    });

    const selectRef = useRef(select);
    const selectedData = useMemo(
        () => (queryResult.data ? selectRef.current(queryResult.data) : undefined),
        [queryResult.data],
    );

    return {
        ...queryResult,
        data: selectedData,
    };
}
