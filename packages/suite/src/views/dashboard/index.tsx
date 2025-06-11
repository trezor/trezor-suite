import styled from 'styled-components';

import { Context } from '@suite-common/message-system';
import { Column } from '@trezor/components';
import { spacings, spacingsPx } from '@trezor/theme';

import { PageHeader } from 'src/components/suite/layouts/SuiteLayout';
import { ContextMessage } from 'src/components/wallet/WalletLayout/AccountBanners/ContextMessage';
import { useLayout } from 'src/hooks/suite';

import { AssetsView } from './AssetsView/AssetsView';
import { DashboardPassphraseBanner } from './DashboardPassphraseBanner';
import { PortfolioCard } from './PortfolioCard/PortfolioCard';
import { PromoBanner } from './PromoBanner';
import { StakeEthCard } from './StakeEthCard/StakeEthCard';
// import { T3T1PromoBanner } from './T3T1PromoBanner/T3T1PromoBanner';

const Container = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${spacingsPx.xl};
`;

export const Dashboard = () => {
    useLayout('Home', <PageHeader />);

    return (
        <Column gap={spacings.xxxxl} data-testid="@dashboard/index">
            <Container>
                <ContextMessage context={Context.getGeneral('dashboard')} />
                <DashboardPassphraseBanner />
                <PortfolioCard />
            </Container>
            {/*<T3T1PromoBanner />*/}
            <AssetsView />
            <StakeEthCard />
            <PromoBanner />
        </Column>
    );
};
