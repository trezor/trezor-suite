import React from 'react';
import styled from 'styled-components';
import NetworkTypeBitcoin from './NetworkTypeBitcoin';
import NetworkTypeEthereum from './NetworkTypeEthereum';
import NetworkTypeXrp from './NetworkTypeXrp';

import { Network } from '@wallet-types';

const Wrapper = styled.div`
    display: flex;
    min-height: 150px;
    margin: 20px 0 20px 0;
    align-items: center;
    justify-content: center;
    border: 1px dashed gray;
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
