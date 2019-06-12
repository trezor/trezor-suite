import React from 'react';
import styled from 'styled-components';
import { connect } from 'react-redux';

import { Text } from 'react-native';
import { Button } from '@trezor/components';
import { goto } from '@suite-actions/routerActions';
import Layout from '@wallet-components/Layout';

const Wallet = () => {
    return (
        <Layout>
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
        </Layout>
    );
};

export default connect()(Wallet);
