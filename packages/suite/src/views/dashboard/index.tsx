import styled from 'styled-components';

import { Context } from '@suite-common/message-system';
import { Column } from '@trezor/components';
import { spacings, spacingsPx } from '@trezor/theme';

import { OutOfQuotaBanner } from 'src/components/suite/banners/SuiteBanners/OutOfQuotaBanner';
import { PageHeader } from 'src/components/suite/layouts/SuiteLayout';
import { ContextMessage } from 'src/components/wallet/WalletLayout/AccountBanners/ContextMessage';
import { useLayout } from 'src/hooks/suite';

import { AssetsView } from './AssetsView/AssetsView';
import { DashboardFooter } from './DashboardFooter';
import { DashboardPromoBanner } from './DashboardPromoBanner/DashboardPromoBanner';
import { PortfolioCard } from './PortfolioCard/PortfolioCard';
import { useNotificationForDisconnectedDevice } from './useNotificationForDisconnectedDevice';

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
            <Container>
                <OutOfQuotaBanner />
                <ContextMessage context={Context.getGeneral('dashboard')} />
                <PortfolioCard />
            </Container>
            <DashboardPromoBanner />
            <AssetsView />
            <DashboardFooter />
        </Column>
    );
};
