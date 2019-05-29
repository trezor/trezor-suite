import React from 'react';
import { connect } from 'react-redux';

import { Text } from 'react-native';
import { Button } from '@trezor/components';
import { State } from '@suite/types';
import { goto } from '@suite/actions/routerActions';


interface Props {
    suite: State['suite'];
    router: State['router'];
}

const Wallet = (props: Props) => {
    return (
        <>
            <Text>Wallet homepage</Text>
            <Button variant="success" onClick={() => goto('/wallet/account#/eth/1')}>
                Ethereum
            </Button>
            <Button variant="success" onClick={() => goto('/wallet/account#/xrp/1')}>
                Ripple
            </Button>
            <Text></Text>
            <Button variant="success" onClick={() => goto('/wallet/settings')}>
                Settings
            </Button>
        </>
    );
};

const mapStateToProps = (state: State) => ({
    suite: state.suite,
    router: state.router,
});

export default connect(mapStateToProps)(Wallet);
