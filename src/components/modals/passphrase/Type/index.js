/* @flow */

import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import { H5, P, colors } from 'trezor-ui-components';
import DeviceIcon from 'components/images/DeviceIcon';

import type { TrezorDevice } from 'flowtype';

type Props = {
    device: TrezorDevice,
};

const Wrapper = styled.div`
    max-width: 360px;
    padding: 30px 48px;
`;

const StyledDeviceIcon = styled(DeviceIcon)`
    margin-bottom: 10px;
`;

const Header = styled.div``;

const PassphraseType = (props: Props) => (
    <Wrapper>
        <Header>
            <StyledDeviceIcon device={props.device} size={32} color={colors.TEXT_SECONDARY} />
            <H5>Complete the action on {props.device.label} device</H5>
            <P size="small">
                If you enter a wrong passphrase, you will not unlock the desired hidden wallet.
            </P>
        </Header>
    </Wrapper>
);

PassphraseType.propTypes = {
    device: PropTypes.object.isRequired,
};

export default PassphraseType;
