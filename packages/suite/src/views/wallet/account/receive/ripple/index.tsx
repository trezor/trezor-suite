import React from 'react';
import styled from 'styled-components';
import Title from '@wallet-components/Title';
import { FormattedMessage } from 'react-intl';

import QrCode from '@wallet-components/QrCode';
import VerifyAddressInput from '@wallet-components/inputs/VerifyAddress';
import messages from './messages';
import { ReceiveProps } from '../index';

const Wrapper = styled.div``;

const RippleReceive = ({ className, ...props }: ReceiveProps) => (
    <Wrapper>
        <Title>
            <FormattedMessage {...messages.TR_RECEIVE_RIPPLE} />
        </Title>
        <VerifyAddressInput
            device={props.device}
            accountPath={props.account.path}
            accountAddress={props.account.descriptor}
            isAddressHidden={props.isAddressHidden}
            isAddressVerified={props.isAddressVerified}
            isAddressUnverified={props.isAddressUnverified}
            isAddressVerifying={props.isAddressVerifying}
            showAddress={props.showAddress}
        />
        {(props.isAddressVerified || props.isAddressUnverified) && !props.isAddressVerifying && (
            <QrCode value={props.account.descriptor} accountPath={props.account.path} />
        )}
    </Wrapper>
);

export default RippleReceive;
