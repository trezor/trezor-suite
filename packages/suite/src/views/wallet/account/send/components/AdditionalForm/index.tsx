import React from 'react';
import styled from 'styled-components';

import NetworkTypeBitcoin from './NetworkTypeBitcoin/Container';
import NetworkTypeEthereum from './NetworkTypeEthereum/Container';
import NetworkTypeXrp from './NetworkTypeXrp/Container';

import { Network } from '@wallet-types';

const Wrapper = styled.div`
    display: flex;
    margin: 20px 0;
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
