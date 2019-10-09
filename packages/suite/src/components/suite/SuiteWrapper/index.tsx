import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import * as routerActions from '@suite-actions/routerActions';

import { isWebUSB } from '@suite-utils/device';
import ConnectDevice from '@suite-components/landing/ConnectDevice';
import Loading from '@suite-components/landing/Loading';
import AcquireDevice from '@suite-components/AcquireDevice';
import { bindActionCreators } from 'redux';
import { AppState, Dispatch } from '@suite-types';

interface OwnProps {
    children: React.ReactNode;
}

const mapStateToProps = (state: AppState) => ({
    suite: state.suite,
    devices: state.devices,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    goto: bindActionCreators(routerActions.goto, dispatch),
});

type Props = OwnProps & ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

const Index = (props: Props) => {
    const { suite } = props;
    const { transport } = props.suite;
    const redirectToBridge = transport && !transport.type;

    useEffect(() => {
        // no available transport, redirect to bridge page
        if (redirectToBridge) {
            props.goto('suite-bridge');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [redirectToBridge]);

    if (!suite.transport || redirectToBridge) {
        // connect was initialized, but didn't emit "TRANSPORT" event yet (it could take a while)
        return <Loading />;
    }

    // no available device
    if (!suite.device) {
        return (
            <ConnectDevice
                showWebUsb={isWebUSB(suite.transport)}
                // showDisconnect={shouldShowDisconnectDevice}
                // deviceLabel={deviceLabel}
                deviceLabel=""
                showDisconnect={false}
            />
        );
    }

    if (suite.device.type === 'unacquired') {
        return <AcquireDevice />;
    }

    if (suite.device.type === 'unreadable') {
        return <AcquireDevice />;
    }

    return <>{props.children}</>;
};

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(Index);
