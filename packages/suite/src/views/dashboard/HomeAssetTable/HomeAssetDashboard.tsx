import { selectDeviceStaticSessionId } from '@suite-common/device';
import { Column } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';

import { HomeAssetBalanceCard } from './HomeAssetBalanceCard';
import { HomeAssetTable } from './HomeAssetTable';
import { DashboardPromoBanner } from '../DashboardPromoBanner/DashboardPromoBanner';

export const HomeAssetDashboard = () => {
    const deviceState = useSelector(selectDeviceStaticSessionId);

    if (deviceState === null) {
        return null;
    }

    return (
        <Column gap={16} data-testid="@dashboard/home-asset">
            <HomeAssetBalanceCard deviceState={deviceState} />
            <DashboardPromoBanner />
            <HomeAssetTable deviceState={deviceState} />
        </Column>
    );
};
