import React from 'react';
import styled from 'styled-components';
import NetworkTypeBitcoin from './components/NetworkTypeBitcoin';
import { Props } from './Container';

const Wrapper = styled.div``;

const Add = (props: Props) => (
    <Wrapper>
        {props.selectedAccount.account?.networkType === 'bitcoin' && (
            <NetworkTypeBitcoin addRecipient={props.sendFormActionsBitcoin.addRecipient} />
        )}
    </Wrapper>
);

export default Add;
