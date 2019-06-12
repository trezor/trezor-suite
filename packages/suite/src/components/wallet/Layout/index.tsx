import React from 'react';
import { connect } from 'react-redux';
import { State } from '@suite-types/index';
import styled from 'styled-components';
import TopNavigation from '@wallet-components/TopNavigation';
import Sidebar from './components/Sidebar';

interface Props {
    router: State['router'];
    suite: State['suite'];
    children: React.ReactNode;
}

const Wrapper = styled.div`
    display: flex;
    width: 100%;
    max-width: 1170px;
    flex-direction: row;
    flex: 1 1 0%;
`;

const Content = styled.div`
    padding: 20px 35px;
`;

const ContentWrapper = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1 1 0%;
    overflow: auto;
`;

const Layout = (props: Props) => (
    <Wrapper>
        <Sidebar isOpen={props.suite.showSidebar} />
        <ContentWrapper>
            <TopNavigation />
            <Content>{props.children}</Content>
        </ContentWrapper>
    </Wrapper>
);

const mapStateToProps = (state: State) => ({
    router: state.router,
    suite: state.suite,
});

export default connect(mapStateToProps)(Layout);
