import React, { FunctionComponent } from 'react';
import { connect } from 'react-redux';
import { Text } from 'react-native';
import { bindActionCreators } from 'redux';

import { Header } from '@trezor/components';
import Router from '@suite/support/Router';

import { State } from '@suite/types';
import { goto } from '@suite/actions/routerActions';

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
        {props.children}
    </>
);

const Wrapper: FunctionComponent<Props> = props => {
    const { suite } = props;

    if (!suite.transport) {
        // TODO: check in props.router if current url needs device / transport (settings, install bridge, import etc.)
        return <Body />;
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
    if (!props.suite.device) {
        return (
            <Body>
                <Text>Connect Trezor to continue</Text>
                <Text>Transport: {suite.transport.type}</Text>
            </Body>
        );
    }

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
