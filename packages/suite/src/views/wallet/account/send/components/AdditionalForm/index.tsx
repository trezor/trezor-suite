import React from 'react';
import styled from 'styled-components';
import { colors } from '@trezor/components-v2';

import NetworkTypeBitcoin from './components/NetworkTypeBitcoin/Container';
import NetworkTypeEthereum from './components/NetworkTypeEthereum/Container';
import NetworkTypeXrp from './components/NetworkTypeRipple/Container';

import { Network } from '@wallet-types';

const Wrapper = styled.div`
    display: flex;
    border-radius: 6px;
    margin-top: 20px;
    border: 2px solid ${colors.BLACK96};
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
