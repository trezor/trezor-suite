import React from 'react';
import styled from 'styled-components';
import Title from '@wallet-components/Title';

import QrCode from '@wallet-components/QrCode';
import VerifyAddressInput from '@wallet-components/inputs/VerifyAddress';

import { FormattedMessage } from 'react-intl';
import messages from './messages';

const Wrapper = styled.div``;

const EthereumReceive = () => (
    <Wrapper>
        <Title>
            <FormattedMessage {...messages.TR_RECEIVE_ETHEREUM_OR_TOKENS} />
        </Title>
        <VerifyAddressInput />
        <QrCode />
    </Wrapper>
);

export default EthereumReceive;
