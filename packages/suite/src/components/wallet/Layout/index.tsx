import React from 'react';
import { connect } from 'react-redux';
import { State } from '@suite-types/index';
import styled, { css } from 'styled-components';
import { variables } from '@trezor/components';
import Sidebar from './components/Sidebar';

const { SCREEN_SIZE } = variables;

interface Props {
    router: State['router'];
    suite: State['suite'];
    topNavigationComponent?: React.ReactNode;
    children: React.ReactNode;
}

const Wrapper = styled.div`
    display: flex;
    width: 100%;
    max-width: 1170px;
    flex-direction: row;
    flex: 1 1 0%;
`;

const ContentWrapper = styled.div<{ preventBgScroll?: boolean }>`
    display: flex;
    flex-direction: column;
    flex: 1 1 0%;
    overflow: auto;

    @media screen and (max-width: ${SCREEN_SIZE.SM}) {
        ${props =>
            props.preventBgScroll &&
            css`
                position: fixed;
                width: 100%;
                min-height: calc(100vh - 52px);
            `}
    }
`;

const Layout = (props: Props) => (
    <Wrapper>
        <Sidebar isOpen={props.suite.showSidebar} />
        <ContentWrapper preventBgScroll={props.suite.showSidebar}>
            {props.topNavigationComponent}
            {props.children}
        </ContentWrapper>
    </Wrapper>
);

const mapStateToProps = (state: State) => ({
    router: state.router,
    suite: state.suite,
});

export default connect(mapStateToProps)(Layout);
