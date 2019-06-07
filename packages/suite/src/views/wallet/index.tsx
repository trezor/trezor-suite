import React from 'react';
import styled from 'styled-components';
import { connect } from 'react-redux';

import { Text } from 'react-native';
import { Button } from '@trezor/components';
import { goto } from '@suite-actions/routerActions';

import CoinMenu from '@wallet-components/CoinMenu';

const Wrapper = styled.div``;

const Wallet = () => {
    return (
        <Wrapper>
            <CoinMenu />
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
        </Wrapper>
    );
};

export default connect()(Wallet);
