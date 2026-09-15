import { ContextMessage } from '@suite/message-system';
import { selectHasExperimentalFeature } from '@suite/settings';
import { Context } from '@suite-common/message-system';
import { Column } from '@trezor/components';

import { OutOfQuotaBanner } from 'src/components/suite/banners/SuiteBanners/OutOfQuotaBanner';
import { PageHeader } from 'src/components/suite/layouts/SuiteLayout';
import { useLayout, useSelector } from 'src/hooks/suite';

import { AssetFirstTable } from './AssetFirstTable/AssetFirstTable';
import { AssetsView } from './AssetsView/AssetsView';
import { DashboardFooter } from './DashboardFooter';
import { DashboardPromoBanner } from './DashboardPromoBanner/DashboardPromoBanner';
import { OnboardingFeedbackBanner } from './OnboardingFeedbackBanner/OnboardingFeedbackBanner';
import { PortfolioCard } from './PortfolioCard/PortfolioCard';
import { useNotificationForDisconnectedDevice } from './useNotificationForDisconnectedDevice';

export const Dashboard = () => {
    const isAssetFirstTableEnabled = useSelector(
        selectHasExperimentalFeature('asset-first-home-table'),
    );

    useLayout('Home', <PageHeader />, <DashboardFooter />);
    useNotificationForDisconnectedDevice();

    return (
        <Column gap={48} data-testid="@dashboard/index">
            <Column gap={24}>
                <OutOfQuotaBanner />
                <ContextMessage context={Context.getGeneral('dashboard')} />
                <PortfolioCard />
                <OnboardingFeedbackBanner />
            </Column>
            <DashboardPromoBanner />
            {isAssetFirstTableEnabled ? <AssetFirstTable /> : <AssetsView />}
        </Column>
    );
};
