import { useCallback, useMemo, useState } from 'react';

import { type YieldAccountOpportunity } from '../types';

type UseYieldAccountsVisibilityProps = {
    yieldAccountOpportunities: YieldAccountOpportunity[];
};

export const useYieldAccountsVisibility = ({
    yieldAccountOpportunities,
}: UseYieldAccountsVisibilityProps) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const { collapsedYieldAccountOpportunities, hiddenYieldAccountOpportunities } = useMemo(() => {
        const visibleOpportunityKeys = new Set(
            yieldAccountOpportunities
                .filter(opportunity => opportunity.hasRewardsData)
                .map(opportunity => opportunity.key),
        );
        const networkSymbols = new Set(
            yieldAccountOpportunities.map(opportunity => opportunity.networkSymbol),
        );

        networkSymbols.forEach(networkSymbol => {
            const hasVisibleOpportunity = yieldAccountOpportunities.some(
                opportunity =>
                    opportunity.networkSymbol === networkSymbol &&
                    visibleOpportunityKeys.has(opportunity.key),
            );

            if (hasVisibleOpportunity) {
                return;
            }

            const fallbackOpportunity = yieldAccountOpportunities.find(
                opportunity => opportunity.networkSymbol === networkSymbol,
            );

            if (fallbackOpportunity) {
                visibleOpportunityKeys.add(fallbackOpportunity.key);
            }
        });

        return {
            collapsedYieldAccountOpportunities: yieldAccountOpportunities.filter(opportunity =>
                visibleOpportunityKeys.has(opportunity.key),
            ),
            hiddenYieldAccountOpportunities: yieldAccountOpportunities.filter(
                opportunity => !visibleOpportunityKeys.has(opportunity.key),
            ),
        };
    }, [yieldAccountOpportunities]);

    const displayedYieldAccountOpportunities = useMemo(
        () => (isExpanded ? yieldAccountOpportunities : collapsedYieldAccountOpportunities),
        [collapsedYieldAccountOpportunities, isExpanded, yieldAccountOpportunities],
    );

    const hasHiddenYieldAccountOpportunities = hiddenYieldAccountOpportunities.length > 0;

    const toggleIsExpanded = useCallback(() => {
        setIsExpanded(prev => !prev);
    }, []);

    return {
        displayedYieldAccountOpportunities,
        hasHiddenYieldAccountOpportunities,
        isExpanded,
        toggleIsExpanded,
    };
};
