import React, { FunctionComponent } from 'react';
import { connect } from 'react-redux';
import { Text } from 'react-native';
import { bindActionCreators } from 'redux';

import { Header } from '@trezor/components';
import Router from '@suite/support/Router';

import { State } from '@suite/types';
import { goto } from '@suite/actions/routerActions';
import DeviceSelection from './DeviceSelection';

interface Props {
    router: State['router'];
    suite: State['suite'];
    devices: State['devices'];
    goto: typeof goto;
}

const Body: FunctionComponent = props => (
    <>
        <Router />
        <Header sidebarEnabled={false} />
        <DeviceSelection />
        {props.children}
    </>
);

const Wrapper: FunctionComponent<Props> = props => {
    const { suite } = props;

    if (!suite.transport) {
        // TODO: check in props.router if current url needs device / transport (settings, install bridge, import etc.)

        // connect was initialized, but didn't emit "TRANSPORT" event yet (it could take a while)
        return <Body>Don't have Transport info not yet.... show preloader?</Body>;
    }
    if (!suite.transport.type) {
        // TODO: render "install bridge"
        return (
            <Body>
                <Text>Install bridge</Text>
            </Body>
        );
    }

    // TODO: render "connect device" view
    // TODO: check if it's not a onboarding page which is waiting for device connection
    if (!props.suite.device) {
        return (
            <Body>
                <Text>Connect Trezor to continue</Text>
                <Text>Transport: {suite.transport.type}</Text>
            </Body>
        );
    }

    // TODO: render requested view
    return (
        <Body>
            <Text>Suite wrapper</Text>
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
)(Wrapper);
