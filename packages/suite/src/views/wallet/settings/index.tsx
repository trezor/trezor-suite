import React from 'react';
import { connect } from 'react-redux';

import { Text } from 'react-native';
import { Button } from '@trezor/components';
import { goto } from '@suite-actions/routerActions';

const Wallet = () => {
    return (
        <>
            <Text>Settings</Text>
            <Button variant="success" onClick={() => goto('/')}>
                Back to wallet
            </Button>
        </>
    );
};

export default connect()(Wallet);
