import { Column } from '@trezor/components';

import { AssetFirstHeader } from './AssetFirstHeader';
import { AssetFirstTable } from './AssetFirstTable';

/**
 * The whole home tab, asset first: what the wallet is worth, and what it holds.
 *
 * It replaces the dashboard rather than sitting inside it — no graph, no promotions, no onboarding
 * banner — so the page is the balance, the actions and the assets, and nothing else.
 *
 * Behind the `asset-first-home-table` experimental feature; without it the dashboard is unchanged.
 */
export const AssetFirstDashboard = () => (
    <Column gap={24} data-testid="@dashboard/asset-first">
        <AssetFirstHeader />
        <AssetFirstTable />
    </Column>
);
