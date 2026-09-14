import { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { useServices } from '@suite-common/dependency-injection';
import { selectNetworkConfigDeps, selectSupportedNetworkSymbols } from '@suite-common/networks';
import { sortByCoin } from '@suite-common/wallet-utils';
import { isNotUndefined } from '@trezor/utils';

import { type YieldAccountOpportunity } from '../types';

type UseYieldAccountsVisibilityProps = {
    yieldAccountOpportunities: YieldAccountOpportunity[];
};

export const useYieldAccountsVisibility = ({
    yieldAccountOpportunities,
}: UseYieldAccountsVisibilityProps) => {
    const networkConfigDeps = useServices(selectNetworkConfigDeps);

    const supportedNetworks = useSelector(selectSupportedNetworkSymbols);
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
                .filter(isNotUndefined);
            const [firstAccountByCoinOrder] = sortByCoin(
                networkConfigDeps,
                [...vaultAccounts],
                supportedNetworks,
            );

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
    }, [networkConfigDeps, supportedNetworks, yieldAccountOpportunities]);

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
