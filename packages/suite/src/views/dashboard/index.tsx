import { ContextMessage } from '@suite/message-system';
import { Context } from '@suite-common/message-system';
import { Column } from '@trezor/components';

import { PerfProfiler } from 'src/components/suite/PerfProfiler';
import { OutOfQuotaBanner } from 'src/components/suite/banners/SuiteBanners/OutOfQuotaBanner';
import { PageHeader } from 'src/components/suite/layouts/SuiteLayout';
import { useLayout } from 'src/hooks/suite';

import { DashboardFooter } from './DashboardFooter';
import { useNotificationForDisconnectedDevice } from './useNotificationForDisconnectedDevice';
import { HomeAssetDashboard } from '../home/HomeAssetDashboard';

/**
 * DRAFT, NOT FOR MERGE. The home asset table is behind the `assetFirstHomeTable` experiment, which
 * no message system config carries yet, so it renders nowhere. Here it is the only Home there is,
 * and what React spends rendering it is reported to the performance instrumentation, so that the
 * selector implementation and the index implementation can be measured against each other in the
 * app. Revert before review.
 */
const DashboardNotices = () => (
    <>
        <OutOfQuotaBanner />
        <ContextMessage context={Context.getGeneral('dashboard')} />
    </>
);

export const Dashboard = () => {
    useLayout('Home', <PageHeader />, <DashboardFooter />);
    useNotificationForDisconnectedDevice();

    return (
        <Column gap={24} data-testid="@dashboard/index">
            <DashboardNotices />
            <PerfProfiler id="home-asset-table">
                <HomeAssetDashboard />
            </PerfProfiler>
        </Column>
    );
};
