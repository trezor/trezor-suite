import { useMemo } from 'react';

import { useAllYieldOpportunities } from '@suite-common/earn-api';

type UseYieldOpportunityDataProps = {
    yieldId: string;
};

export const useYieldOpportunityData = ({ yieldId }: UseYieldOpportunityDataProps) => {
    const { yieldOpportunities } = useAllYieldOpportunities();

    return useMemo(() => {
        const vault = yieldOpportunities.find(yieldOpportunity => yieldOpportunity.id === yieldId);

        return {
            vault,
            apy: vault?.rewardRate.total ? Number((vault.rewardRate.total * 100).toFixed(1)) : null,
            tokenSymbol: vault?.token?.symbol?.toUpperCase(),
            vaultTokenName: vault?.outputToken?.name,
        };
    }, [yieldId, yieldOpportunities]);
};
