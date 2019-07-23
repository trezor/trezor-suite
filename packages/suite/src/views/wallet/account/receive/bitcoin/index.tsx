import React from 'react';
import styled from 'styled-components';
import Title from '@wallet-components/Title';
import { FormattedMessage } from 'react-intl';

import QrCode from '@wallet-components/QrCode';
import VerifyAddressInput from '@wallet-components/inputs/VerifyAddress';
import messages from './messages';

const Wrapper = styled.div``;

const BitcoinReceive = () => (
    <Wrapper>
        <Title>
            <FormattedMessage {...messages.TR_RECEIVE_BITCOIN} />
        </Title>
        <VerifyAddressInput />
        <QrCode value="2121212" />
    </Wrapper>
);

export default BitcoinReceive;
