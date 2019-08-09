import React, { FunctionComponent } from 'react';
import { connect } from 'react-redux';
import { Text } from 'react-native';
import { bindActionCreators } from 'redux';
import styled from 'styled-components';

import { Loader, Button } from '@trezor/components';

import { isWebUSB } from '@suite-utils/device';
import { goto } from '@suite-actions/routerActions';
import ConnectDevice from '@suite-components/landing/ConnectDevice';
import AcquireDevice from '@suite-components/AcquireDevice';
import Layout from '@suite-components/Layout';
import Bridge from '@suite-views/bridge';
import { getRoute } from '@suite/utils/suite/router';
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
    const { suite, router } = props;

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

    // onboarding handles TrezorConnect events by itself
    // and display proper view (install bridge, connect/disconnect device etc.)
    if (router.app === 'onboarding') {
        return (
            <Layout fullscreenMode disableNotifications>
                {props.children}
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
        return (
            <Layout isLanding>
                <ConnectDevice showWebUsb={isWebUSB(suite.transport)} />
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
