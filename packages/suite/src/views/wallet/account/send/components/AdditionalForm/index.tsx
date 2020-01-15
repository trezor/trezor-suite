import { Network } from '@wallet-types';
import React from 'react';
import styled from 'styled-components';

import NetworkTypeBitcoin from './components/NetworkTypeBitcoin/Container';
import NetworkTypeEthereum from './components/NetworkTypeEthereum/Container';
import NetworkTypeXrp from './components/NetworkTypeRipple/Container';

const Wrapper = styled.div`
    display: flex;
    margin-top: 40px;
`;

interface Props {
    networkType: Network['networkType'];
}

const AdditionalForm = (props: Props) => (
    <Wrapper>
        {props.networkType === 'bitcoin' && <NetworkTypeBitcoin />}
        {props.networkType === 'ethereum' && <NetworkTypeEthereum />}
        {props.networkType === 'ripple' && <NetworkTypeXrp />}
    </Wrapper>
);

export default AdditionalForm;
