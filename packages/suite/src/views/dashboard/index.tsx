import styled from 'styled-components';
import { useLayout } from 'src/hooks/suite';
import { AssetsView } from './components/AssetsView';
import PortfolioCard from './components/PortfolioCard';
import SecurityFeatures from './components/SecurityFeatures';
import { PromoBanner } from './components/PromoBanner';
import { AppNavigationPanel } from 'src/components/suite';
import { breakpointMediaQueries } from '@trezor/styles';

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
    // temporary navigation panel
    const Nav = () => <AppNavigationPanel title="Home" />;

    useLayout('Home', Nav);

    return (
        <Wrapper data-test="@dashboard/index">
            <PortfolioCard />
            <AssetsView />
            <SecurityFeatures />
            <PromoBanner />
        </Wrapper>
    );
};
