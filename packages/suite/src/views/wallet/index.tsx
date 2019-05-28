import React from 'react';
import { connect } from 'react-redux';

import { Text } from 'react-native';
import { Button } from '@trezor/components';
import { State } from '@suite/types';

const onClick = () => {
    // TrezorConnect.getPublicKey();
};

interface Props {
    suite: State['suite'];
    router: State['router'];
}

const Wallet = (props: Props) => {
    return (
        <>
            <Text>Wallet {props.router.pathname}</Text>
            <Button variant="success" onClick={onClick}>
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
