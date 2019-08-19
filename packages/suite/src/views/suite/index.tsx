import React, { FunctionComponent } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import styled from 'styled-components';

import { Loader } from '@trezor/components';

import { isWebUSB } from '@suite-utils/device';
import { goto } from '@suite-actions/routerActions';
import ConnectDevice from '@suite-components/landing/ConnectDevice';
import Layout from '@suite-components/Layout';
import Bridge from '@suite-views/bridge';
import { AppState } from '@suite-types';

interface Props {
    router: AppState['router'];
    suite: AppState['suite'];
    devices: AppState['devices'];
    goto: typeof goto;
    children: React.ReactNode;
}

const LoaderWrapper = styled.div`
    display: flex;
    flex: 1;
    justify-content: center;
    align-items: center;
`;

const Index: FunctionComponent<Props> = props => {
    const { suite } = props;

    if (!suite.transport) {
        // connect was initialized, but didn't emit "TRANSPORT" event yet (it could take a while)
        return (
            <Layout isLanding>
                <LoaderWrapper>
                    <Loader text="Loading" size={100} strokeWidth={1} />
                </LoaderWrapper>
            </Layout>
        );
    }

    // no available transport
    // TODO: redirect to brige page
    if (!suite.transport.type) {
        return (
            <Layout isLanding>
                <Bridge />
            </Layout>
        );
    }

    // no available device
    if (!suite.device) {
        // TODO
        // const { initialized, browserState, transport } = props.connect;
        // const { disconnectRequest } = props.wallet;
        // const localStorageError = props.localStorage.error;
        // const connectError = props.connect.error;

        // if (props.wallet.showBetaDisclaimer) return <BetaDisclaimer />;

        // const error = !initialized ? localStorageError || connectError : null;
        // const shouldShowUnsupportedBrowser = browserState.supported === false;
        // const shouldShowInstallBridge = initialized && connectError;
        // const shouldShowConnectDevice = props.wallet.ready && props.devices.length < 1;
        // const shouldShowDisconnectDevice = !!disconnectRequest;
        // const isLoading =
        //     !error &&
        //     !shouldShowUnsupportedBrowser &&
        //     !shouldShowConnectDevice &&
        //     !shouldShowUnsupportedBrowser;

        // const deviceLabel = disconnectRequest ? disconnectRequest.label : '';
        // // corner case: display InstallBridge view on "/" route
        // // it has it's own Container and props
        // if (shouldShowInstallBridge) return <InstallBridge />;
        return (
            <Layout isLanding>
                <ConnectDevice
                    showWebUsb={isWebUSB(suite.transport)}
                    // showDisconnect={shouldShowDisconnectDevice}
                    // deviceLabel={deviceLabel}
                    deviceLabel=""
                    showDisconnect={false}
                />
            </Layout>
        );
    }

    return <Layout showSuiteHeader>{props.children}</Layout>;
};

const mapStateToProps = (state: AppState) => ({
    router: state.router,
    suite: state.suite,
    devices: state.devices,
});

export default connect(
    mapStateToProps,
    dispatch => ({
        goto: bindActionCreators(goto, dispatch),
    }),
)(Index);
