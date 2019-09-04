import React from 'react';
import { colors, variables, Loader } from '@trezor/components';
import styled from 'styled-components';
import { connect } from 'react-redux';
import * as discoveryActions from '@wallet-actions/discoveryActions';
import { Discovery } from '@wallet-reducers/discoveryReducer';
import { AppState, Dispatch } from '@suite-types';

import ProgressBar from './components/ProgressBar';
import Row from './components/Row';

const Wrapper = styled.div``;

const LoadingWrapper = styled.div`
    display: flex;
    padding-top: 10px;
    justify-content: flex-start;
    align-items: center;
    padding-left: 20px;
`;

const LoadingText = styled.div`
    font-size: ${variables.FONT_SIZE.SMALL};
    color: ${colors.TEXT_SECONDARY};
    padding-left: 10px;
`;

const mapStateToProps = (state: AppState) => ({
    device: state.suite.device,
    accounts: state.wallet.accounts,
    discovery: state.wallet.discovery,
    router: state.router,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    // getDiscoveryForDevice: bindActionCreators(discoveryActions.getDiscoveryForDevice, dispatch),
    getDiscoveryForDevice: () => dispatch(discoveryActions.getDiscoveryForDevice()),
});

type Props = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

const getLoadingProgress = (discovery?: Discovery) => {
    if (discovery && discovery.loaded && discovery.total) {
        return Math.round((discovery.loaded / discovery.total) * 100);
    }
    return 0;
};

const Menu = ({ device, accounts, getDiscoveryForDevice }: Props) => {
    const discovery = getDiscoveryForDevice();
    if (!device || !discovery) {
        return (
            <Wrapper>
                <LoadingWrapper>
                    <Loader size={15} />
                    <LoadingText>Loading accounts</LoadingText>
                </LoadingWrapper>
            </Wrapper>
        );
    }

    const list = accounts.filter(account => account.deviceState === device.state);
    return (
        <Wrapper>
            <ProgressBar progress={getLoadingProgress(discovery)} />
            {list.length === 0 && ( // TODO check discovery progress not accounts
                <LoadingWrapper>
                    <Loader size={15} />
                    <LoadingText>Loading accounts</LoadingText>
                </LoadingWrapper>
            )}
            {list.map(account => (
                <Row account={account} />
            ))}
        </Wrapper>
    );
};

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(Menu);
