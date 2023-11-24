import styled from 'styled-components';
import { breakpointMediaQueries } from '@trezor/styles';
import { useLayout } from 'src/hooks/suite';
import { AssetsView } from './components/AssetsView';
import PortfolioCard from './components/PortfolioCard';
import SecurityFeatures from './components/SecurityFeatures';
import { PromoBanner } from './components/PromoBanner';
import { T2B1PromoBanner } from './components/T2B1PromoBanner';
import { PageHeader } from 'src/components/suite/layouts/SuiteLayout';
import { StakeEthCard } from './components/StakeEthCard';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 64px;

    ${breakpointMediaQueries.below_sm} {
        /* for the promo banner */
        margin-bottom: 52px;
    }
`;

export const Dashboard = () => {
    useLayout('Home', PageHeader);

    return (
        <Wrapper data-test="@dashboard/index">
            <PortfolioCard />
            <T2B1PromoBanner />
            <AssetsView />
            <SecurityFeatures />
            <StakeEthCard />
            <PromoBanner />
        </Wrapper>
    );
};
