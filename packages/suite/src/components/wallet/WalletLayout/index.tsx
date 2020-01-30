import React from 'react';
import { connect } from 'react-redux';
import styled, { css } from 'styled-components';
import { variables } from '@trezor/components-v2';
import WalletNotifications from '@wallet-components/Notifications';
import Content from '@wallet-components/Content';
import DiscoveryProgress from '@wallet-components/DiscoveryProgress';
import { AppState } from '@suite-types';
import { SuiteLayout } from '@suite-components';
import Menu from '@wallet-components/Menu';

const { SCREEN_SIZE } = variables;

const mapStateToProps = (state: AppState) => ({
    router: state.router,
    suite: state.suite,
    wallet: state.wallet,
});

type Props = {
    title?: string;
    children?: React.ReactNode;
} & ReturnType<typeof mapStateToProps>;

const ContentWrapper = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1 1 0%;
    overflow: auto;
`;

const WalletLayout = (props: Props) => {
    return (
        <SuiteLayout title={props.title || 'Trezor Suite | Wallet'} secondaryMenu={<Menu />}>
            <ContentWrapper>
                <DiscoveryProgress />
                <WalletNotifications />
                <Content>{props.children}</Content>
            </ContentWrapper>
        </SuiteLayout>
    );
};

export default connect(mapStateToProps)(WalletLayout);
