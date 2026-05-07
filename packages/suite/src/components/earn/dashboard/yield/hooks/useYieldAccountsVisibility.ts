import { useCallback, useMemo, useState } from 'react';

import { type Account } from '@suite-common/wallet-types';
import { sortByCoin } from '@suite-common/wallet-utils';

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
        const vaultIds = new Set(
            yieldAccountOpportunities.map(opportunity => opportunity.vault.id),
        );

        vaultIds.forEach(vaultId => {
            const hasVisibleOpportunity = yieldAccountOpportunities.some(
                opportunity =>
                    opportunity.vault.id === vaultId && visibleOpportunityKeys.has(opportunity.key),
            );

            if (hasVisibleOpportunity) {
                return;
            }

            const vaultOpportunities = yieldAccountOpportunities.filter(
                opportunity => opportunity.vault.id === vaultId,
            );
            const vaultAccounts = vaultOpportunities
                .map(opportunity => opportunity.account)
                .filter((account): account is Account => account !== undefined);
            const [firstAccountByCoinOrder] = sortByCoin([...vaultAccounts]);

            const fallbackOpportunity = firstAccountByCoinOrder
                ? vaultOpportunities.find(
                      opportunity => opportunity.account?.key === firstAccountByCoinOrder.key,
                  )
                : vaultOpportunities[0];

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
