import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { Text } from 'react-native';

import { Button } from '@trezor/components';
import { State, TrezorDevice } from '@suite/types';
import TrezorConnect, { DEVICE_EVENT } from 'trezor-connect';

interface Props {
    suite: State['suite'];
}

const onClick = async (device?: TrezorDevice) => {
    if (!device) return;
    const resp = await TrezorConnect.wipeDevice({
        device,
    });
    if (resp.success) {
        // do something
    }
};

const Index = (props: Props) => {
    // consider to move "set listeners" to a better place
    // hot reloading will mount this component again and then there will be two event listeners
    useEffect(() => {
        TrezorConnect.on(DEVICE_EVENT, () => {
            // HANDLE DEV EVENT IN OBOARDING
        });
    }, []);

    return (
        <>
            <Text>ONBOARDING</Text>
            <Text>
                TRANSPORT: {props.suite.transport ? props.suite.transport.type : 'no-transport'}
            </Text>
            <Text>DEVICE: {props.suite.device ? 'connected' : 'disconnected'}</Text>
            <Button variant="success" onClick={() => onClick(props.suite.device)}>
                START
            </Button>
        </>
    );
};

const mapStateToProps = (state: State) => ({
    suite: state.suite,
});

export default connect(mapStateToProps)(Index);
