import React from 'react';
import { connect } from 'react-redux';

import { Text } from 'react-native';
import { Button } from '@trezor/components';
import { State } from '@suite/types';

const onPress = () => {
    // TrezorConnect.getPublicKey();
};

interface Props {
    suite: State['suite'];
    router: State['router'];
}

const Wallet = (props: Props) => {
    return (
        <>
            <Text>Wallet/Send {props.router.pathname}</Text>
            <Button variant="success" onClick={onPress}>
                click
            </Button>
        </>
    );
};

const mapStateToProps = (state: State) => ({
    suite: state.suite,
    router: state.router,
});

export default connect(mapStateToProps)(Wallet);
