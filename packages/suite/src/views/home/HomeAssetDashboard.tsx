import { memo } from 'react';

import { Column } from '@trezor/components';

import { HomeAssetFeedback } from './HomeAssetFeedback';
import { HomeAssetTable } from './HomeAssetsTable/HomeAssetTable';
import { HomeBalanceCard } from './HomeBalance/HomeBalanceCard';
import { DashboardPromoBanner } from '../dashboard/DashboardPromoBanner/DashboardPromoBanner';

export const HomeAssetDashboard = memo(() => (
    <Column gap={16} data-testid="@dashboard/home-asset">
        <HomeBalanceCard />
        <DashboardPromoBanner />
        <HomeAssetTable />
        <HomeAssetFeedback />
    </Column>
));
