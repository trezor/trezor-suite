import React from 'react';
import styled from 'styled-components';
import { LayoutContext } from '@suite-components';
import { variables } from '@trezor/components';
import AssetsCard from './components/AssetsCard';
import PortfolioCard from './components/PortfolioCard';
import SecurityFeatures from './components/SecurityFeatures/Container';
import NewsFeed from './components/NewsFeed';

const Wrapper = styled.div`
    padding: 64px 32px 32px 32px;

    @media screen and (max-width: ${variables.SCREEN_SIZE.LG}) {
        padding: 16px;
    }
`;

const Divider = styled.div`
    display: flex;
    margin-bottom: 64px;
`;

const Dashboard = () => {
    // set SuiteLayout
    const { setLayout } = React.useContext(LayoutContext);

    React.useMemo(() => {
        if (setLayout) setLayout(undefined, undefined);
    }, [setLayout]);

    return (
        <Wrapper data-test="@dashboard/index">
            <PortfolioCard />
            <Divider />
            <AssetsCard />
            <Divider />
            <SecurityFeatures />
            <Divider />
            <NewsFeed />
            <Divider />
        </Wrapper>
    );
};

export default Dashboard;
