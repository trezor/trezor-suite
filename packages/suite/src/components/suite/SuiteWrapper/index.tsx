import React, { FunctionComponent } from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';

import { Loader } from '@trezor/components';

import { isWebUSB } from '@suite-utils/device';
import ConnectDevice from '@suite-components/landing/ConnectDevice';
import AcquireDevice from '@suite-components/AcquireDevice';
import SuiteLayout from '@suite-components/SuiteLayout';
import Bridge from '@suite-views/bridge';
import { AppState } from '@suite-types';

interface Props {
    suite: AppState['suite'];
    devices: AppState['devices'];
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
            <SuiteLayout isLanding>
                <LoaderWrapper>
                    <Loader text="Loading" size={100} strokeWidth={1} />
                </LoaderWrapper>
            </SuiteLayout>
        );
    }

    // no available transport
    // TODO: redirect to bridge page
    if (!suite.transport.type) {
        return (
            <SuiteLayout isLanding>
                <Bridge />
            </SuiteLayout>
        );
    }

    // no available device
    if (!suite.device) {
        return (
            <SuiteLayout isLanding>
                <ConnectDevice
                    showWebUsb={isWebUSB(suite.transport)}
                    // showDisconnect={shouldShowDisconnectDevice}
                    // deviceLabel={deviceLabel}
                    deviceLabel=""
                    showDisconnect={false}
                />
            </SuiteLayout>
        );
    }

    if (suite.device.type === 'unacquired') {
        return (
            <SuiteLayout showSuiteHeader>
                <AcquireDevice />
            </SuiteLayout>
        );
    }

    if (suite.device.type === 'unreadable') {
        return (
            <SuiteLayout showSuiteHeader>
                <AcquireDevice />
            </SuiteLayout>
        );
    }

    return <SuiteLayout showSuiteHeader>{props.children}</SuiteLayout>;
};

const mapStateToProps = (state: AppState) => ({
    suite: state.suite,
    devices: state.devices,
});

export default connect(mapStateToProps)(Index);
