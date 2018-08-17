/* @flow */

import React, { Component } from 'react';
import TrezorConnect from 'trezor-connect';
import { H2 } from 'components/Heading';

import type { State, TrezorDevice } from 'flowtype';

import DisconnectDevice from './components/DisconnectDevice';
import ConnectHIDDevice from './components/ConnectHIDDevice';
import ConnectWebUsbDevice from './components/ConnectWebUsbDevice';

type Props = {
    transport: $PropertyType<$ElementType<State, 'connect'>, 'transport'>;
    disconnectRequest: ?TrezorDevice;
}

const ConnectDevice = (props: Props) => {
    const { transport, disconnectRequest } = props;
    if (disconnectRequest) {
        return <DisconnectDevice instanceLabel={props.disconnectRequest.instanceLabel} />;
    } if (transport && transport.version.indexOf('webusb') >= 0) {
        return <ConnectWebUsbDevice {...props} />;
    }
    return <ConnectHIDDevice {...props} />;
};

export default ConnectDevice;