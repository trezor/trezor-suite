import React from 'react';
import styled from 'styled-components';
import { Translation } from 'src/components/suite/Translation';

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
                    <Translation id="TR_UNVERIFIED_ADDRESS_COMMA_SHOW" />
                ) : (
                    <Translation id="TR_UNVERIFIED_ADDRESS_COMMA_CONNECT" />
                )}
            </Content>
        )}
        {!addressUnverified && (
            <Content>
                {isConnected ? (
                    <Translation id="TR_SHOW_ON_TREZOR" />
                ) : (
                    <Translation id="TR_CONNECT_YOUR_TREZOR_TO_CHECK" />
                )}
            </Content>
        )}
    </Wrapper>
);

export default VerifyAddressTooltip;
