import React from 'react';
import styled from 'styled-components';
import { useSendFormContext } from '@wallet-hooks';

import BitcoinOptions from './components/BitcoinOptions';
import EthereumOptions from './components/EthereumOptions';
import RippleOptions from './components/RippleOptions';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
`;

const Content = styled.div`
    display: flex;
    padding: 32px 42px;
`;

const Line = styled.div`
    width: 100%;
    height: 1px;
    border-top: 1px solid ${props => props.theme.STROKE_GREY};
    margin-top: 10px;
`;

const Options = () => {
    const {
        account: { networkType },
    } = useSendFormContext();

    return (
        <Wrapper>
            <Line />
            <Content>
                {networkType === 'bitcoin' && <BitcoinOptions />}
                {networkType === 'ethereum' && <EthereumOptions />}
                {networkType === 'ripple' && <RippleOptions />}
            </Content>
        </Wrapper>
    );
};

export default Options;
