import React from 'react';
import styled from 'styled-components';
import { Translation } from '@suite-components/Translation';
import messages from '@suite/support/messages';

const Wrapper = styled.div``;
const Content = styled.div``;

interface Props {
    isConnected: boolean;
    isAvailable: boolean;
    addressUnverified: boolean;
}

const VerifyAddressTooltip = ({ isConnected, isAvailable, addressUnverified }: Props) => (
    <Wrapper>
        {addressUnverified && (
            <Content>
                {isConnected && isAvailable ? (
                    <Translation>{messages.TR_UNVERIFIED_ADDRESS_COMMA_SHOW}</Translation>
                ) : (
                    <Translation>{messages.TR_UNVERIFIED_ADDRESS_COMMA_CONNECT}</Translation>
                )}
            </Content>
        )}
        {!addressUnverified && (
            <Content>
                {isConnected ? (
                    <Translation>{messages.TR_SHOW_ON_TREZOR}</Translation>
                ) : (
                    <Translation>{messages.TR_CONNECT_YOUR_TREZOR_TO_CHECK}</Translation>
                )}
            </Content>
        )}
    </Wrapper>
);

export default VerifyAddressTooltip;
