import React from 'react';
import { connect } from 'react-redux';

import { Text } from 'react-native';
import { Button } from '@trezor/components';
import { goto } from '@suite-actions/routerActions';

const Wallet = () => {
    return (
        <>
            <Text>Wallet homepage</Text>
            <Button variant="success" onClick={() => goto('/wallet/account#/eth/1')}>
                Ethereum
            </Button>
            <Button variant="success" onClick={() => goto('/wallet/account#/xrp/1')}>
                Ripple
            </Button>
            <Text />
            <Button variant="success" onClick={() => goto('/wallet/settings')}>
                Settings
            </Button>
        </>
    );
};

export default connect()(Wallet);
