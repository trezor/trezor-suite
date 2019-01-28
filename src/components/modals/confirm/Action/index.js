/* @flow */

import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { H3 } from 'components/Heading';
import DeviceIcon from 'components/images/DeviceIcon';
import type { TrezorDevice } from 'flowtype';

type Props = {
    device: TrezorDevice;
}

const Wrapper = styled.div``;

const Header = styled.div`
    padding: 48px;
`;

const ConfirmAction = (props: Props) => (
    <Wrapper>
        <Header>
            <DeviceIcon device={props.device} size={100} />
            <H3>Confirm action on your Trezor</H3>
        </Header>
    </Wrapper>
);

ConfirmAction.propTypes = {
    device: PropTypes.object.isRequired,
};


export default ConfirmAction;