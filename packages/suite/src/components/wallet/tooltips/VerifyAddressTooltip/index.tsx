import React from 'react';
import styled from 'styled-components';
import { Translation } from '@suite-components/Translation';
import l10nMessages from './messages';

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
                    <Translation>{l10nMessages.TR_UNVERIFIED_ADDRESS_COMMA_SHOW}</Translation>
                ) : (
                    <Translation>{l10nMessages.TR_UNVERIFIED_ADDRESS_COMMA_CONNECT}</Translation>
                )}
            </Content>
        )}
        {!addressUnverified && (
            <Content>
                {isConnected ? (
                    <Translation>{l10nMessages.TR_SHOW_ON_TREZOR}</Translation>
                ) : (
                    <Translation>{l10nMessages.TR_CONNECT_YOUR_TREZOR_TO_CHECK}</Translation>
                )}
            </Content>
        )}
    </Wrapper>
);

export default VerifyAddressTooltip;
