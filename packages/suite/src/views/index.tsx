import React, { FunctionComponent } from 'react';
import { connect } from 'react-redux';
import { Text } from 'react-native';
import { Header as AppHeader, colors } from '@trezor/components';
import { bindActionCreators } from 'redux';
import styled from 'styled-components';

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

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
    align-items: center;
`;

const AppWrapper = styled.div`
    width: 100%;
    max-width: 1170px;
    margin: 0 auto;
    flex: 1;
    background: ${colors.WHITE};
    display: flex;
    flex-direction: column;
    border-radius: 4px 4px 0px 0px;
    margin-top: 10px;

    @media screen and (max-width: 1170px) {
        border-radius: 0px;
        margin-top: 0px;
    }
`;

const SuiteHeader = styled.div`
    display: flex;
    padding: 10px;
    border-radius: 4px 4px 0px 0px;
    align-items: center;
    box-sizing: border-box;
    width: 100%;
    background: ${colors.WHITE};
    max-width: 1170px;
    margin: 10px auto;
    height: 80px;
    flex-direction: row;
`;

const Body: FunctionComponent = props => (
    <Wrapper>
        <Router />
        <AppHeader sidebarEnabled={false} />
        <SuiteHeader>
            <DeviceSelection />
        </SuiteHeader>
        <AppWrapper>{props.children}</AppWrapper>
    </Wrapper>
);

const Index: FunctionComponent<Props> = props => {
    const { suite, router } = props;

    // connect was initialized, but didn't emit "TRANSPORT" event yet (it could take a while)
    if (!suite.transport) {
        // TODO: check in props.router if current url needs device or transport at all (settings, install bridge, import etc.)
        return <Body>Don't have Transport info not yet.... show preloader?</Body>;
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
        // TODO: render "install bridge"
        return (
            <Body>
                <Text>Install bridge</Text>
            </Body>
        );
    }

    // no available device
    if (!suite.device) {
        // TODO: render "connect device" view with webusb button
        return (
            <Body>
                <Text>Connect Trezor to continue</Text>
                <Text>Transport: {suite.transport.type}</Text>
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
    return <Body>{props.children}</Body>;
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
