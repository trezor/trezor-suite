import { Column } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';

import { AssetFirstBalanceCard } from './AssetFirstBalanceCard';
import { AssetFirstTable } from './AssetFirstTable';
import { selectAssetFirstRows } from './assetFirstTableSelectors';
import { DashboardPromoBanner } from '../DashboardPromoBanner/DashboardPromoBanner';

/**
 * The whole home tab, asset first: what the wallet is worth, and what it holds.
 *
 * It replaces the dashboard rather than sitting inside it — no graph card and no onboarding
 * banner — so the page is the balance, what is being promoted, and the assets, under the app's own
 * page header.
 *
 * The total at the top and the table below read the same rows, from `selectAssetFirstRows`, so the
 * total is the sum of what the table shows by construction — not a second answer to the same
 * question.
 *
 * Behind the asset-first home table experiment; without it the dashboard is unchanged.
 */
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
