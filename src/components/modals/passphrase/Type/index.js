/* @flow */

import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import colors from 'config/colors';

import DeviceIcon from 'components/images/DeviceIcon';
import { H3 } from 'components/Heading';
import P from 'components/Paragraph';

import type { TrezorDevice } from 'flowtype';

type Props = {
    device: TrezorDevice;
}

const Wrapper = styled.div`
    max-width: 360px;
    padding: 30px 48px;
`;

const Header = styled.div``;

const PassphraseType = (props: Props) => (
    <Wrapper>
        <Header>
            <DeviceIcon device={props.device} size={60} color={colors.TEXT_SECONDARY} />
            <H3>Complete the action on { props.device.label } device</H3>
            <P isSmaller>If you enter a wrong passphrase, you will not unlock the desired hidden wallet.</P>
        </Header>
    </Wrapper>
);

PassphraseType.propTypes = {
    device: PropTypes.object.isRequired,
};

export default PassphraseType;