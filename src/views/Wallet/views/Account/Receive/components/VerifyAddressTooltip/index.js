import React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import l10nMessages from './index.messages';


const Wrapper = styled.div``;
const Content = styled.div``;

const VerifyAddressTooltip = ({ isConnected, isAvailable, addressUnverified }) => (
    <Wrapper>
        {addressUnverified && (
            <Content>
                {isConnected && isAvailable
                    ? <FormattedMessage {...l10nMessages.TR_UNVERIFIED_ADDRESS_COMMA_SHOW} />
                    : <FormattedMessage {...l10nMessages.TR_UNVERIFIED_ADDRESS_COMMA_CONNECT} />}
            </Content>
        )}
        {!addressUnverified && (
            <Content>
                {isConnected
                    ? <FormattedMessage {...l10nMessages.TR_SHOW_ON_TREZOR} />
                    : <FormattedMessage {...l10nMessages.TR_CONNECT_YOUR_TREZOR_TO_CHECK} />}
            </Content>
        )}
    </Wrapper>
);

VerifyAddressTooltip.propTypes = {
    isConnected: PropTypes.bool.isRequired,
    isAvailable: PropTypes.bool.isRequired,
    addressUnverified: PropTypes.bool.isRequired,
};


export default VerifyAddressTooltip;
