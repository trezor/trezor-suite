import React from 'react';
import styled from 'styled-components';
import { LayoutContext } from '@suite-components';
import AssetsCard from './components/AssetsCard';
import PortfolioCard from './components/PortfolioCard';
import SecurityFeatures from './components/SecurityFeatures';
import NewsFeed from './components/NewsFeed';

const Wrapper = styled.div`
    width: 100%;
    margin-top: 40px; /* 40px + 24px (default padding in suite layout) = 64px (as designed) */
    margin-bottom: 32px;
`;

const Divider = styled.div`
    display: flex;
    margin-bottom: 64px;
`;

const Dashboard = () => {
    // set SuiteLayout
    const { setLayout } = React.useContext(LayoutContext);

    React.useEffect(() => {
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
