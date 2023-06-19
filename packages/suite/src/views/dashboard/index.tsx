import React from 'react';
import styled from 'styled-components';
import { variables } from '@trezor/components';
import { useLayout } from 'src/hooks/suite';
import AssetsCard from './components/AssetsCard';
import PortfolioCard from './components/PortfolioCard';
import SecurityFeatures from './components/SecurityFeatures';
import { PromoBanner } from './components/PromoBanner';

const Wrapper = styled.div`
    width: 100%;
    margin-top: 40px; /* 40px + 24px (default padding in suite layout) = 64px (as designed) */
    margin-bottom: 32px;

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        margin-top: 10px;
        margin-bottom: 0px;
    }
`;

const Divider = styled.div`
    display: flex;
    margin-bottom: 64px;
`;

const Dashboard = () => {
    useLayout();

    return (
        <Wrapper data-test="@dashboard/index">
            <PortfolioCard />
            <Divider />
            <AssetsCard />
            <Divider />
            <SecurityFeatures />
            <Divider />
            <PromoBanner />
        </Wrapper>
    );
};

export default Dashboard;
