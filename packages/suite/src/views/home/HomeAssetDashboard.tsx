import { memo } from 'react';

import { events, injectDesktopAnalytics } from '@suite/analytics';
import { Nfts } from '@suite/nfts';
import {
    selectAllAccountsToList,
    selectDiscoveryForSelectedDevice,
} from '@suite-common/wallet-core';
import { Column } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';

import { useSelector } from '#src/hooks/suite';
import { selectDiscoveryOverallStatus } from '#src/utils/wallet/selectDiscoveryOverallStatus';

import { HomeAssetEmptyState } from './HomeAssetEmptyState';
import { HomeAssetFeedback } from './HomeAssetFeedback';
import { HomeAssetTable } from './HomeAssetsTable/HomeAssetTable';
import { HomeBalanceCard } from './HomeBalance/HomeBalanceCard';
import { getHomeAssetEmptyStateKind } from './homeAssetEmptyStateKind';
import { DashboardPromoBanner } from '../dashboard/DashboardPromoBanner/DashboardPromoBanner';

export const HomeAssetDashboard = memo(() => {
    const { analytics } = useServices(injectDesktopAnalytics);
    const emptyStateKind = useSelector(state =>
        getHomeAssetEmptyStateKind({
            accounts: selectAllAccountsToList(state),
            discoveryStatus: selectDiscoveryOverallStatus(state),
            discoveryRunStatus: selectDiscoveryForSelectedDevice(state)?.status,
        }),
    );

    if (emptyStateKind !== undefined) {
        return <HomeAssetEmptyState kind={emptyStateKind} />;
    }

    return (
        <Column gap={16} data-testid="@dashboard/home-asset">
            <HomeBalanceCard />
            <DashboardPromoBanner />
            <HomeAssetTable />
            <HomeAssetFeedback />
            <Nfts
                onToggle={({ isOpen, collectionCount, hiddenCount }) =>
                    analytics.report({
                        type: events.dashboardNftsEvent.name,
                        payload: isOpen
                            ? { action: 'expand', collectionCount, hiddenCount }
                            : { action: 'collapse' },
                    })
                }
            />
        </Column>
    );
});
