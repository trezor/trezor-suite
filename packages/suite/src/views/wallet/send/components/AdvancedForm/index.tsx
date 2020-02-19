import { Network } from '@wallet-types';
import React from 'react';
import styled from 'styled-components';

import AdvancedFormBitcoin from './components/AdvancedFormBitcoin/Container';
import AdvancedFormEthereum from './components/AdvancedFormEthereum/Container';
import AdvancedFormRipple from './components/AdvancedFormRipple/Container';

const Wrapper = styled.div`
    display: flex;
    margin-top: 40px;
`;

interface Props {
    networkType: Network['networkType'];
}

export default (props: Props) => (
    <Wrapper>
        {props.networkType === 'bitcoin' && <AdvancedFormBitcoin />}
        {props.networkType === 'ethereum' && <AdvancedFormEthereum />}
        {props.networkType === 'ripple' && <AdvancedFormRipple />}
    </Wrapper>
);
