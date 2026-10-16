import { memo } from 'react';

import { Nfts } from '@suite/nfts';
import { Column } from '@trezor/components';

import { BlurUrls } from 'src/views/wallet/tokens/common/BlurUrls';

import { HomeAssetFeedback } from './HomeAssetFeedback';
import { HomeAssetTable } from './HomeAssetsTable/HomeAssetTable';
import { HomeBalanceCard } from './HomeBalance/HomeBalanceCard';
import { DashboardPromoBanner } from '../dashboard/DashboardPromoBanner/DashboardPromoBanner';

export const HomeAssetDashboard = memo(() => (
    <Column gap={16} data-testid="@dashboard/home-asset">
        <HomeBalanceCard />
        <DashboardPromoBanner />
        <HomeAssetTable />
        <Nfts CollectionName={BlurUrls} />
        <HomeAssetFeedback />
    </Column>
));
