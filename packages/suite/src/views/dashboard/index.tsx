import styled from 'styled-components';
import { breakpointMediaQueries } from '@trezor/styles';
import { useLayout, useSelector } from 'src/hooks/suite';
import { AssetsView } from './components/AssetsView';
import PortfolioCard from './components/PortfolioCard';
import SecurityFeatures from './components/SecurityFeatures';
import { PromoBanner } from './components/PromoBanner';
import { T3T1PromoBanner } from './components/T3T1PromoBanner';
import { PageHeader } from 'src/components/suite/layouts/SuiteLayout';
import { StakeEthCard } from './components/StakeEthCard/StakeEthCard';
import { selectSuiteFlags } from 'src/reducers/suite/suiteReducer';
import { DashboardPassphraseBanner } from './components/DashboardPassphraseBanner';
import { Column } from '@trezor/components';
import { spacingsPx } from '@trezor/theme';

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
    const { isViewOnlyModeVisible } = useSelector(selectSuiteFlags);

    return (
        <Wrapper data-test="@dashboard/index">
            <PortfolioCard />
            <Column gap={8}>
                <T3T1PromoBanner />
                <DashboardPassphraseBanner />
            </Column>
            <AssetsView />
            {!isViewOnlyModeVisible && <SecurityFeatures />}
            <StakeEthCard />
            <PromoBanner />
        </Wrapper>
    );
};
