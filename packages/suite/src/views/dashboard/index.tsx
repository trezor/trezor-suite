import React from 'react';
import styled from 'styled-components';
import { LayoutContext } from '@suite-components';
import { variables } from '@trezor/components';
import { AssetsCard, PortfolioCard, SecurityFeatures, NewsFeed } from '@dashboard-components';

const Wrapper = styled.div`
    padding: 16px 32px 32px 32px;
    @media screen and (max-width: ${variables.SCREEN_SIZE.LG}) {
        padding: 16px;
    }
`;

const Divider = styled.div`
    display: flex;
    margin-bottom: 20px;
`;

const Row = styled.div`
    display: flex;
`;

export default () => {
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
            <Row>
                <NewsFeed />
            </Row>
            <Divider />
        </Wrapper>
    );
};
