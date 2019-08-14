import React from 'react';
import styled from 'styled-components';
import Title from '@wallet-components/Title';

import QrCode from '@wallet-components/QrCode';
import VerifyAddressInput from '@wallet-components/inputs/VerifyAddress';

import { FormattedMessage } from 'react-intl';
import { AppState } from '@suite/reducers/store';
import messages from './messages';

const Wrapper = styled.div``;

interface Props {
    account: AppState['wallet']['selectedAccount']['account'];
    device: AppState['suite']['device'];
}

const EthereumReceive = (props: Props) => {
    return (
        <Wrapper>
            <Title>
                <FormattedMessage {...messages.TR_RECEIVE_ETHEREUM_OR_TOKENS} />
            </Title>
            <VerifyAddressInput {...props} />
            <QrCode value="2121212" />
        </Wrapper>
    );
};

export default EthereumReceive;
