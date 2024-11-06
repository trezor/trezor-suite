import styled from 'styled-components';

import { breakpointMediaQueries } from '@trezor/styles';
import { spacingsPx } from '@trezor/theme';

import { useLayout } from 'src/hooks/suite';
import { PageHeader } from 'src/components/suite/layouts/SuiteLayout';

import { AssetsView } from './AssetsView/AssetsView';
import { PortfolioCard } from './PortfolioCard/PortfolioCard';
import { PromoBanner } from './PromoBanner';
import { T3T1PromoBanner } from './T3T1PromoBanner/T3T1PromoBanner';
import { StakeEthCard } from './StakeEthCard/StakeEthCard';
import { DashboardPassphraseBanner } from './DashboardPassphraseBanner';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${spacingsPx.xxxxl};

    ${breakpointMediaQueries.below_sm} {
        /* for the promo banner */
        margin-bottom: 52px;
    }
`;

export const Dashboard = () => {
    useLayout('Home', PageHeader);

    return (
        <Wrapper data-testid="@dashboard/index">
            <DashboardPassphraseBanner />
            <PortfolioCard />
            <T3T1PromoBanner />
            <AssetsView />
            <StakeEthCard />
            <PromoBanner />
        </Wrapper>
    );
};
