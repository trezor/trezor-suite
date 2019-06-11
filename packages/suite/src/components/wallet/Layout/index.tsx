import React from 'react';
import { connect } from 'react-redux';
import { State } from '@suite-types/index';
import styled from 'styled-components';
import TopNavigation from '@wallet-components/TopNavigation';

interface Props {
    router: State['router'];
    suite: State['suite'];
    children: React.ReactNode;
}

const WalletWrapper = styled.div`
    padding: 20px 35px;
`;

const Layout = (props: Props) => (
    <>
        <TopNavigation />
        <WalletWrapper>{props.children}</WalletWrapper>
    </>
);

const mapStateToProps = (state: State) => ({
    router: state.router,
    suite: state.suite,
});

export default connect(mapStateToProps)(Layout);
