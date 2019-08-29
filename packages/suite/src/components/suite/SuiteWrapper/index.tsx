import React, { FunctionComponent } from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';

import { Loader } from '@trezor/components';

import { isWebUSB } from '@suite-utils/device';
import ConnectDevice from '@suite-components/landing/ConnectDevice';
import AcquireDevice from '@suite-components/AcquireDevice';
import Layout from '@suite-components/Layout';
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
            <Layout isLanding>
                <LoaderWrapper>
                    <Loader text="Loading" size={100} strokeWidth={1} />
                </LoaderWrapper>
            </Layout>
        );
    }

    // no available transport
    // TODO: redirect to bridge page
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

    if (suite.device.type === 'unacquired') {
        return (
            <Layout showSuiteHeader>
                <AcquireDevice />
            </Layout>
        );
    }

    if (suite.device.type === 'unreadable') {
        return (
            <Layout showSuiteHeader>
                <AcquireDevice />
            </Layout>
        );
    }

    return <Layout showSuiteHeader>{props.children}</Layout>;
};

const mapStateToProps = (state: AppState) => ({
    suite: state.suite,
    devices: state.devices,
});

export default connect(mapStateToProps)(Index);
