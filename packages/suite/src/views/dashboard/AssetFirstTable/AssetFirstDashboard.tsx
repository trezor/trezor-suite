import { selectDeviceStaticSessionId } from '@suite-common/device';
import { Column } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';

import { AssetFirstBalanceCard } from './AssetFirstBalanceCard';
import { AssetFirstTable } from './AssetFirstTable';
import { type AssetRow, selectAssetFirstRows } from './assetFirstTableSelectors';
import { DashboardPromoBanner } from '../DashboardPromoBanner/DashboardPromoBanner';

const EMPTY_ROWS: readonly AssetRow[] = [];

export const AssetFirstDashboard = () => {
    const deviceState = useSelector(selectDeviceStaticSessionId);
    const rows = useSelector(state =>
        deviceState === null ? EMPTY_ROWS : selectAssetFirstRows(state, deviceState),
    );

    if (deviceState === null) {
        return null;
    }

    return (
        <Column gap={16} data-testid="@dashboard/asset-first">
            <AssetFirstBalanceCard rows={rows} />
            <DashboardPromoBanner />
            <AssetFirstTable deviceState={deviceState} />
        </Column>
    );
};
