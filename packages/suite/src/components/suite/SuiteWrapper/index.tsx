import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';
import * as routerActions from '@suite-actions/routerActions';

import { Loader } from '@trezor/components';

import { isWebUSB } from '@suite-utils/device';
import ConnectDevice from '@suite-components/landing/ConnectDevice';
import AcquireDevice from '@suite-components/AcquireDevice';
import SuiteLayout from '@suite-components/SuiteLayout';
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

const LoaderWrapper = styled.div`
    display: flex;
    flex: 1;
    justify-content: center;
    align-items: center;
`;

const Index = (props: Props) => {
    const { transport } = props.suite;
    useEffect(() => {
        // no available transport, redirect to bridge page
        if (transport && !transport.type) {
            props.goto('suite-bridge');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [transport]);

    const { suite } = props;

    if (!suite.transport) {
        // connect was initialized, but didn't emit "TRANSPORT" event yet (it could take a while)
        // TODO: this should be separate component
        return (
            <SuiteLayout isLanding>
                <LoaderWrapper>
                    <Loader text="Loading" size={100} strokeWidth={1} />
                </LoaderWrapper>
            </SuiteLayout>
        );
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

    return props.children;
};

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(Index);
