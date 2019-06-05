import React from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';

import { Text } from 'react-native';
import { Button } from '@trezor/components';
import LeftNavigation from '@suite/components/wallet/navigation/Left';
import { goto } from '@suite/actions/routerActions';

const Wrapper = styled.div``;

const Wallet = () => {
    return (
        <Wrapper>
            <LeftNavigation />
            WALLET
            {/* <Button variant="success" onClick={() => goto('/wallet/account#/eth/1')}>
                Ethereum
            </Button>
            <Button variant="success" onClick={() => goto('/wallet/account#/xrp/1')}>
                Ripple
            </Button>
            <Text />
            <Button variant="success" onClick={() => goto('/wallet/settings')}>
                Settings
            </Button> */}
        </Wrapper>
    );
};

export default connect()(Wallet);
