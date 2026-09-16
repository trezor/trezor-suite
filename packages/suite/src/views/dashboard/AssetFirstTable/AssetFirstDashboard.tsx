import { Column } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';

import { AssetFirstHeader } from './AssetFirstHeader';
import { AssetFirstTable } from './AssetFirstTable';
import { selectAssetFirstTableKeys } from './assetFirstTableSelectors';

/**
 * The whole home tab, asset first: what the wallet is worth, and what it holds.
 *
 * It replaces the dashboard rather than sitting inside it — no graph, no promotions, no onboarding
 * banner — so the page is the balance, the actions and the assets, and nothing else.
 *
 * The list of assets is chosen here and handed to both halves, so the total at the top is over the
 * rows in the table below it by construction.
 *
 * Behind the `asset-first-home-table` experimental feature; without it the dashboard is unchanged.
 */
export const AssetFirstDashboard = () => {
    const assetKeys = useSelector(selectAssetFirstTableKeys);

    return (
        <Column gap={24} data-testid="@dashboard/asset-first">
            <AssetFirstHeader assetKeys={assetKeys} />
            <AssetFirstTable assetKeys={assetKeys} />
        </Column>
    );
};
