import { useMemo } from 'react';

import { type YieldDto } from '@suite-common/earn-stablecoin-defs';
import { useFreshRef } from '@trezor/react-utils';

import { useAllYieldOpportunities } from './useAllYieldOpportunities';

interface UseYieldOpportunityProps<T extends YieldDto[keyof YieldDto] | YieldDto = YieldDto> {
    select?: (yieldOpportunity: YieldDto) => T;
}

const defaultSelect = <T extends YieldDto[keyof YieldDto] | YieldDto = YieldDto>(
    yieldOpportunity: YieldDto,
): T => yieldOpportunity as T;

// TODO: add new endpoint for this
export function useYieldOpportunity<T extends YieldDto[keyof YieldDto] | YieldDto = YieldDto>(
    vaultId: string | undefined,
    { select = defaultSelect }: UseYieldOpportunityProps<T> = {},
) {
    const { data: yieldOpportunities, ...queryResult } = useAllYieldOpportunities({
        enabled: Boolean(vaultId),
    });
    const selectRef = useFreshRef(select);

    const data = useMemo<T | undefined>(() => {
        const yieldOpportunity = yieldOpportunities.find(vault => vault.id === vaultId);

        return yieldOpportunity ? selectRef.current(yieldOpportunity) : undefined;
    }, [yieldOpportunities, vaultId, selectRef]);

    return {
        ...queryResult,
        data,
    };
}
