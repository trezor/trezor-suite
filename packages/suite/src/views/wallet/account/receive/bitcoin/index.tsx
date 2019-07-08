import React from 'react';
import styled from 'styled-components';
import Title from '@wallet-components/Title';

import { FormattedMessage } from 'react-intl';
import messages from './messages';

const Wrapper = styled.div``;

const BitcoinReceive = () => (
    <Wrapper>
        <Title>
            <FormattedMessage {...messages.TR_RECEIVE_BITCOIN} />
        </Title>
    </Wrapper>
);

export default BitcoinReceive;
