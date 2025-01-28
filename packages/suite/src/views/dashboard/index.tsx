import { Column } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { PageHeader } from 'src/components/suite/layouts/SuiteLayout';
import { useLayout } from 'src/hooks/suite';

import { AssetsView } from './AssetsView/AssetsView';
import { DashboardPassphraseBanner } from './DashboardPassphraseBanner';
import { PortfolioCard } from './PortfolioCard/PortfolioCard';
import { PromoBanner } from './PromoBanner';
import { StakeEthCard } from './StakeEthCard/StakeEthCard';
import { T3T1PromoBanner } from './T3T1PromoBanner/T3T1PromoBanner';

export const Dashboard = () => {
    useLayout('Home', <PageHeader />);

    return (
        <Column gap={spacings.xxxxl} data-testid="@dashboard/index">
            <DashboardPassphraseBanner />
            <PortfolioCard />
            <T3T1PromoBanner />
            <AssetsView />
            <StakeEthCard />
            <PromoBanner />
        </Column>
    );
};
