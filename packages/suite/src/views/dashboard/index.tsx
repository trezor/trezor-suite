import styled from 'styled-components';

import { Context } from '@suite-common/message-system';
import { Column } from '@trezor/components';
import { spacings, spacingsPx } from '@trezor/theme';

import { PageHeader } from 'src/components/suite/layouts/SuiteLayout';
import { ContextMessage } from 'src/components/wallet/WalletLayout/AccountBanners/ContextMessage';
import { useLayout } from 'src/hooks/suite';

import { AssetsView } from './AssetsView/AssetsView';
import { DashboardFooter } from './DashboardFooter';
import { DashboardPassphraseBanner } from './DashboardPassphraseBanner';
import { DashboardPromoBanner } from './DashboardPromoBanner/DashboardPromoBanner';
import { PortfolioCard } from './PortfolioCard/PortfolioCard';
import { StakeEthCard } from './StakeEthCard/StakeEthCard';
import { useNotificationForDisconnectedDevice } from './useNotificationForDisconnectedDevice';
import { StartContent } from '../start/StartContent';

const Container = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${spacingsPx.xl};
`;

export const Dashboard = () => {
    useLayout('Home', <PageHeader />);
    useNotificationForDisconnectedDevice();

    return (
        <Column gap={spacings.xxxxl} data-testid="@dashboard/index">
            <StartContent>
                <Container>
                    <ContextMessage context={Context.getGeneral('dashboard')} />
                    <DashboardPassphraseBanner />
                    <PortfolioCard />
                </Container>
                <DashboardPromoBanner />
                <AssetsView />
                <StakeEthCard />
                <DashboardFooter />
            </StartContent>
        </Column>
    );
};
