import React from 'react';
import styled from 'styled-components';
import { useSendContext } from '@suite/hooks/wallet/useSendContext';
import NetworkTypeBitcoin from './components/NetworkTypeBitcoin';

const Wrapper = styled.div``;

export default () => {
    const { account } = useSendContext();
    const { networkType } = account;
    return <Wrapper>{networkType === 'bitcoin' && <NetworkTypeBitcoin />}</Wrapper>;
};
