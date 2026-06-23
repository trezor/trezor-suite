import { useCallback, useRef, useState } from 'react';

import { selectDesktopAnalyticsDep } from '@suite/analytics';
import { events } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { type Network } from '@suite-common/wallet-config';

export const filterNetworksByName = (networks: Network[], searchQuery: string) => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
        return networks;
    }

    return networks.filter(({ name }) => name.toLowerCase().includes(normalizedQuery));
};

export const useNetworkSettingsSearch = (allNetworks: Network[]) => {
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const [searchQuery, setSearchQuery] = useState('');
    const hasReportedSearchUsed = useRef(false);

    const hasActiveSearch = searchQuery.trim().length > 0;

    const filterNetworks = useCallback(
        (networks: Network[]) => filterNetworksByName(networks, searchQuery),
        [searchQuery],
    );

    const hasNoSearchResults = hasActiveSearch && filterNetworks(allNetworks).length === 0;

    const handleSearchChange = useCallback(
        (value: string) => {
            setSearchQuery(value);

            if (value.length === 0) {
                hasReportedSearchUsed.current = false;

                return;
            }

            if (value.length === 1 && !hasReportedSearchUsed.current) {
                hasReportedSearchUsed.current = true;
                analytics.report({
                    type: events.settingsNetworkSearchUsedEvent.name,
                    payload: {
                        platform: 'desktop',
                        origin: 'network-settings',
                    },
                });
            }
        },
        [analytics],
    );

    const handleSearchClear = useCallback(() => {
        setSearchQuery('');
        hasReportedSearchUsed.current = false;
    }, []);

    return {
        searchQuery,
        hasActiveSearch,
        hasNoSearchResults,
        filterNetworks,
        handleSearchChange,
        handleSearchClear,
    };
};
