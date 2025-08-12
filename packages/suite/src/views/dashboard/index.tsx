import styled from 'styled-components';

import { Context } from '@suite-common/message-system';
import { selectHasBitcoinOnlyFirmware } from '@suite-common/wallet-core';
import { Column } from '@trezor/components';
import { spacings, spacingsPx } from '@trezor/theme';

import { PageHeader } from 'src/components/suite/layouts/SuiteLayout';
import { ContextMessage } from 'src/components/wallet/WalletLayout/AccountBanners/ContextMessage';
import { useLayout, useSelector } from 'src/hooks/suite';

import { AssetsView } from './AssetsView/AssetsView';
import { DashboardFooter } from './DashboardFooter';
import { DashboardPassphraseBanner } from './DashboardPassphraseBanner';
import { DashboardPromoBanner } from './DashboardPromoBanner/DashboardPromoBanner';
import { PortfolioCard } from './PortfolioCard/PortfolioCard';
import { StakingDashboard } from './StakingDashboard/StakingDashboard';
import { useNotificationForDisconnectedDevice } from './useNotificationForDisconnectedDevice';

const Container = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${spacingsPx.xl};
`;

export const Dashboard = () => {
    useLayout('Home', <PageHeader />);
    useNotificationForDisconnectedDevice();

    const hasBitcoinOnlyFirmware = useSelector(selectHasBitcoinOnlyFirmware);

    return (
        <Column gap={spacings.xxxxl} data-testid="@dashboard/index">
            <Container>
                <ContextMessage context={Context.getGeneral('dashboard')} />
                <DashboardPassphraseBanner />
                <PortfolioCard />
            </Container>
            <DashboardPromoBanner />
            <AssetsView />
            {!hasBitcoinOnlyFirmware && <StakingDashboard />}
            <DashboardFooter />
        </Column>
    );
};
