import React from 'react';
import styled from 'styled-components';
import NetworkTypeBitcoin from './components/NetworkTypeBitcoin';

const Wrapper = styled.div``;

export default props => {
    const { addOutput, networkType } = props;
    return (
        <Wrapper>
            {networkType === 'bitcoin' && <NetworkTypeBitcoin addOutput={addOutput} />}
        </Wrapper>
    );
};
