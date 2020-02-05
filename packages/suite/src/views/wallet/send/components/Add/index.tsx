import React from 'react';
import styled from 'styled-components';
import NetworkTypeBitcoin from './components/NetworkTypeBitcoin';
import { Props } from './Container';

const Wrapper = styled.div``;

const Add = (props: Props) => {
    const networkType = props.selectedAccount.account?.networkType;
    return (
        <Wrapper>
            {networkType === 'bitcoin' && (
                <NetworkTypeBitcoin addRecipient={props.sendFormActionsBitcoin.addRecipient} />
            )}
        </Wrapper>
    );
};

export default Add;
