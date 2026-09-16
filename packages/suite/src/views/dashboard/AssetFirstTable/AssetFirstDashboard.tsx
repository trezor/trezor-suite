import { Column } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';

import { AssetFirstHeader } from './AssetFirstHeader';
import { AssetFirstTable } from './AssetFirstTable';
import { selectAssetFirstRows } from './assetFirstTableSelectors';

/**
 * The whole home tab, asset first: what the wallet is worth, and what it holds.
 *
 * It replaces the dashboard rather than sitting inside it — no graph, no promotions, no onboarding
 * banner — so the page is the balance, the actions and the assets, and nothing else.
 *
 * The rows are chosen here and handed to both halves, so the total at the top is the sum of the
 * rows in the table below it by construction — not a second answer to the same question.
 *
 * Behind the `asset-first-home-table` experimental feature; without it the dashboard is unchanged.
 */
export const AssetFirstDashboard = () => {
    const rows = useSelector(selectAssetFirstRows);

    return (
        <Column gap={24} data-testid="@dashboard/asset-first">
            <AssetFirstHeader rows={rows} />
            <AssetFirstTable rows={rows} />
        </Column>
    );
};
