import React, { FunctionComponent } from 'react';
import { connect } from 'react-redux';
import { Text } from 'react-native';
import { Header as AppHeader, colors, Button, Loader } from '@trezor/components';
import { bindActionCreators } from 'redux';
import styled from 'styled-components';

import InstallBridge from '@suite/views/bridge';
import ConnectDevice from '@suite/components/landing/ConnectDevice';

import Router from '@suite/support/Router';

import { State } from '@suite/types';
import { goto } from '@suite/actions/routerActions';
import DeviceSelection from '../components/DeviceSelection';
import AcquireDevice from '../components/AcquireDevice';

interface Props {
    router: State['router'];
    suite: State['suite'];
    devices: State['devices'];
    goto: typeof goto;
}

const PageWrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
    background: ${props => (props.isLanding ? colors.LANDING : 'none')};
    align-items: center;
`;

const AppWrapper = styled.div`
    width: 100%;
    max-width: 1170px;
    margin: 0 auto;
    flex: 1;
    background: ${props => (props.isLanding ? 'none' : colors.WHITE)};
    display: flex;
    flex-direction: column;
    align-items: center;
    border-radius: 4px 4px 0px 0px;
    margin-top: 10px;

    @media screen and (max-width: 1170px) {
        border-radius: 0px;
        margin-top: 0px;
    }
`;

const Left = styled.div``;
const Right = styled.div``;
const Link = styled.div`
    cursor: pointer;
`;

const SuiteHeader = styled.div`
    display: flex;
    padding: 10px;
    border-radius: 4px 4px 0px 0px;
    align-items: center;
    box-sizing: border-box;
    justify-content: space-between;
    width: 100%;
    background: ${colors.WHITE};
    max-width: 1170px;
    margin: 10px auto;
    height: 80px;
    flex-direction: row;
`;

const Body: FunctionComponent = props => (
    <PageWrapper isLanding={props.isLanding}>
        <Router />
        <AppHeader sidebarEnabled={false} />
        <AppWrapper isLanding={props.isLanding}>{props.children}</AppWrapper>
    </PageWrapper>
);

const Index: FunctionComponent<Props> = props => {
    const { suite, router } = props;

    // connect was initialized, but didn't emit "TRANSPORT" event yet (it could take a while)
    if (!suite.transport) {
        // TODO: check in props.router if current url needs device or transport at all (settings, install bridge, import etc.)
        return (
            <Body isLanding>
                <Loader text="Loading" size={100} />
            </Body>
        );
    }

    // onboarding handles TrezorConnect events by itself
    // and display proper view (install bridge, connect/disconnect device etc.)
    if (router.app === 'onboarding') {
        return (
            <Body>
                <Text>Onboarding wrapper</Text>
                {props.children}
            </Body>
        );
    }

    // no available transport
    if (!suite.transport.type) {
        return (
            <Body>
                <InstallBridge />
            </Body>
        );
    }

    // no available device
    if (!suite.device) {
        // TODO: render "connect device" view with webusb button
        return (
            <Body isLanding>
                <ConnectDevice />
            </Body>
        );
    }

    // connected device is in unexpected mode
    if (suite.device.type !== 'acquired') {
        // TODO: render "acquire device" or "unreadable device" page
        return (
            <Body>
                <AcquireDevice />
            </Body>
        );
    }

    if (suite.device.mode !== 'normal') {
        // TODO: render "unexpected mode" page (bootloader, seedless, not initialized)
        // not-initialized should redirect to onboarding
        return (
            <Body>
                <Text>Device is in unexpected mode: {suite.device.mode}</Text>
                <Text>Transport: {suite.transport.type}</Text>
            </Body>
        );
    }

    // TODO: render requested view
    return (
        <Body>
            <SuiteHeader>
                <Left>
                    <DeviceSelection data-test="@suite/device_selection" />
                </Left>
                <Right>
                    <Button onClick={() => goto('/settings')}>device settings</Button>
                </Right>
            </SuiteHeader>
            {props.children}
        </Body>
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
