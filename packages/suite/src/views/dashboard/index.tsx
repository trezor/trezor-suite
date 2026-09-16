import { ContextMessage } from '@suite/message-system';
import { Context, ExperimentId, useExperiment } from '@suite-common/message-system';
import { Column } from '@trezor/components';

import { OutOfQuotaBanner } from 'src/components/suite/banners/SuiteBanners/OutOfQuotaBanner';
import { PageHeader } from 'src/components/suite/layouts/SuiteLayout';
import { useLayout } from 'src/hooks/suite';

import { AssetFirstDashboard } from './AssetFirstTable/AssetFirstDashboard';
import { AssetsView } from './AssetsView/AssetsView';
import { DashboardFooter } from './DashboardFooter';
import { DashboardPromoBanner } from './DashboardPromoBanner/DashboardPromoBanner';
import { OnboardingFeedbackBanner } from './OnboardingFeedbackBanner/OnboardingFeedbackBanner';
import { PortfolioCard } from './PortfolioCard/PortfolioCard';
import { useNotificationForDisconnectedDevice } from './useNotificationForDisconnectedDevice';

export const Dashboard = () => {
    const { activeExperimentVariant } = useExperiment(ExperimentId.assetFirstHomeTable);
    const isAssetFirstTableEnabled = activeExperimentVariant?.variant === 'B';

    // The asset-first page carries its own balance and actions, so the app's page header would
    // only repeat them.
    useLayout('Home', isAssetFirstTableEnabled ? undefined : <PageHeader />, <DashboardFooter />);
    useNotificationForDisconnectedDevice();

    // The asset-first home tab is the whole page, not another section of it.
    if (isAssetFirstTableEnabled) {
        return (
            <Column gap={48} data-testid="@dashboard/index">
                <AssetFirstDashboard />
            </Column>
        );
    }

    return (
        <Column gap={48} data-testid="@dashboard/index">
            <Column gap={24}>
                <OutOfQuotaBanner />
                <ContextMessage context={Context.getGeneral('dashboard')} />
                <PortfolioCard />
                <OnboardingFeedbackBanner />
            </Column>
            <DashboardPromoBanner />
            <AssetsView />
        </Column>
    );
};
