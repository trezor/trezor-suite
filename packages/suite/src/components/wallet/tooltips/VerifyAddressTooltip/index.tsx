import React from 'react';
import styled from 'styled-components';
import { FormattedMessage } from 'react-intl';
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
                    <FormattedMessage {...l10nMessages.TR_UNVERIFIED_ADDRESS_COMMA_SHOW} />
                ) : (
                    <FormattedMessage {...l10nMessages.TR_UNVERIFIED_ADDRESS_COMMA_CONNECT} />
                )}
            </Content>
        )}
        {!addressUnverified && (
            <Content>
                {isConnected ? (
                    <FormattedMessage {...l10nMessages.TR_SHOW_ON_TREZOR} />
                ) : (
                    <FormattedMessage {...l10nMessages.TR_CONNECT_YOUR_TREZOR_TO_CHECK} />
                )}
            </Content>
        )}
    </Wrapper>
);

export default VerifyAddressTooltip;
