import { ContextMessage } from '@suite/message-system';
import { Context } from '@suite-common/message-system';
import { Column } from '@trezor/components';
import {
    AssetFirstHomeExperiment,
    AssetsView,
    DashboardFooter,
    DashboardPromoBanner,
    HomeAssetDashboard,
    OnboardingFeedbackBanner,
    OutOfQuotaBanner,
    PageHeader,
    PortfolioCard,
    useLayout,
    useNotificationForDisconnectedDevice,
} from '@trezor/suite';

/**
 * What Home says regardless of which Home the user got.
 *
 * TODO: which of the old dashboard's parts belong in the new one is not settled. The quota banner
 * and the message system's dashboard notices are here because a user in the experiment should not
 * stop hearing about either, but `OnboardingFeedbackBanner` — and anything added here later — has
 * not been decided on, so it still shows only in the dashboard as it was.
 */
const DashboardNotices = () => (
    <>
        <OutOfQuotaBanner />
        <ContextMessage context={Context.getGeneral('dashboard')} />
    </>
);

const DashboardAsItWas = () => (
    <Column gap={48} data-testid="@dashboard/index">
        <Column gap={24}>
            <DashboardNotices />
            <PortfolioCard />
            <OnboardingFeedbackBanner />
        </Column>
        <DashboardPromoBanner />
        <AssetsView />
    </Column>
);

export const DashboardPage = () => {
    useLayout('Home', <PageHeader />, <DashboardFooter />);
    useNotificationForDisconnectedDevice();

    return (
        <AssetFirstHomeExperiment
            asItWas={<DashboardAsItWas />}
            assetFirst={
                <Column gap={24} data-testid="@dashboard/index">
                    <DashboardNotices />
                    <HomeAssetDashboard />
                </Column>
            }
        />
    );
};
