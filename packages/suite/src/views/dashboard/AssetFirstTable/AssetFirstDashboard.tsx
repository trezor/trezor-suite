import { Column } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';

import { AssetFirstBalanceCard } from './AssetFirstBalanceCard';
import { AssetFirstTable } from './AssetFirstTable';
import { selectAssetFirstRows } from './assetFirstTableSelectors';
import { DashboardPromoBanner } from '../DashboardPromoBanner/DashboardPromoBanner';

export const AssetFirstDashboard = () => {
    const rows = useSelector(selectAssetFirstRows);

    return (
        <Column gap={16} data-testid="@dashboard/asset-first">
            <AssetFirstBalanceCard rows={rows} />
            <DashboardPromoBanner />
            <AssetFirstTable />
        </Column>
    );
};
