import React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';

const Wrapper = styled.div``;
const Content = styled.div``;

const VerifyAddressTooltip = ({ isConnected, isAvailable, addressUnverified }) => (
    <Wrapper>
        {addressUnverified && (
            <Content>
                Unverified address. {isConnected && isAvailable ? 'Show on Trezor' : 'Connect your Trezor to verify it.'}
            </Content>
        )}
        {!addressUnverified && (
            <Content>
                {isConnected ? 'Show on Trezor' : 'Connect your Trezor to verify address.'}
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
