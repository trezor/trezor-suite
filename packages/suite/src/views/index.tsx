import React, { FunctionComponent } from 'react';
import { connect } from 'react-redux';
import { Text } from 'react-native';
import { bindActionCreators } from 'redux';
import { colors, Button, Loader } from '@trezor/components';

import styled from 'styled-components';

import InstallBridge from '@suite/views/bridge';
import ConnectDevice from '@suite/components/landing/ConnectDevice';

import { State } from '@suite/types';
import { goto } from '@suite/actions/routerActions';
import AcquireDevice from '../components/AcquireDevice';
import DeviceSelection from '../components/DeviceSelection';
import Layout from './Layout';

interface Props {
    router: State['router'];
    suite: State['suite'];
    devices: State['devices'];
    goto: typeof goto;
    children: React.ReactNode;
}

const SuiteHeader = styled.div`
    display: flex;
    padding: 5px 15px 5px 5px;
    border-bottom: 1px solid ${colors.BODY};
    border-radius: 4px 4px 0px 0px;
    align-items: center;
    box-sizing: border-box;
    justify-content: space-between;
    width: 100%;
    background: ${colors.WHITE};
    max-width: 1170px;
    flex-direction: row;
`;

const Left = styled.div``;
const Right = styled.div``;
const Link = styled.div`
    cursor: pointer;
`;

const Index: FunctionComponent<Props> = props => {
    const { suite, router } = props;

    // connect was initialized, but didn't emit "TRANSPORT" event yet (it could take a while)
    if (!suite.transport) {
        // TODO: check in props.router if current url needs device or transport at all (settings, install bridge, import etc.)
        return (
            <Layout isLanding>
                <Loader text="Loading" size={100} strokeWidth={1} />
            </Layout>
        );
    }

    // onboarding handles TrezorConnect events by itself
    // and display proper view (install bridge, connect/disconnect device etc.)
    if (router.app === 'onboarding') {
        return (
            <Layout>
                <Text>Onboarding wrapper</Text>
                {props.children}
            </Layout>
        );
    }

    // no available transport
    if (!suite.transport.type) {
        return (
            <Layout>
                <InstallBridge />
            </Layout>
        );
    }

    // no available device
    if (!suite.device) {
        // TODO: render "connect device" view with webusb button
        return (
            <Layout isLanding>
                <ConnectDevice />
            </Layout>
        );
    }

    // connected device is in unexpected mode
    if (suite.device.type !== 'acquired') {
        // TODO: render "acquire device" or "unreadable device" page
        return (
            <Layout>
                <AcquireDevice />
            </Layout>
        );
    }

    if (suite.device.mode !== 'normal') {
        // TODO: render "unexpected mode" page (bootloader, seedless, not initialized)
        // not-initialized should redirect to onboarding
        return (
            <Layout>
                <Text>Device is in unexpected mode: {suite.device.mode}</Text>
                <Text>Transport: {suite.transport.type}</Text>
            </Layout>
        );
    }

    // TODO: render requested view
    return (
        <Layout>
            <SuiteHeader>
                <Left>
                    <DeviceSelection data-test="@suite/device_selection" />
                </Left>
                <Right>
                    <Button onClick={() => goto('/settings')}>device settings</Button>
                </Right>
            </SuiteHeader>
            {props.children}
        </Layout>
    );
};

const mapStateToProps = (state: State) => ({
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
