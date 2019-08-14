import React from 'react';
import styled from 'styled-components';
import Title from '@wallet-components/Title';
import { FormattedMessage } from 'react-intl';

import QrCode from '@wallet-components/QrCode';
import VerifyAddressInput from '@wallet-components/inputs/VerifyAddress';
import messages from './messages';
import { ReceiveProps } from '../index';

const Wrapper = styled.div``;

const BitcoinReceive = ({ className, ...props }: ReceiveProps) => (
    <Wrapper>
        <Title>
            <FormattedMessage {...messages.TR_RECEIVE_BITCOIN} />
        </Title>
        <VerifyAddressInput {...props} />
        <QrCode value="21s21212" />
    </Wrapper>
);

export default BitcoinReceive;
