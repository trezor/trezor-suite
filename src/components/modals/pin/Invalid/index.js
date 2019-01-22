/* @flow */

import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import { H3 } from 'components/Heading';
import P from 'components/Paragraph';

import type { TrezorDevice } from 'flowtype';

type Props = {
    device: TrezorDevice;
}

const Wrapper = styled.div`
    padding: 30px 48px;
`;

const InvalidPin = (props: Props) => (
    <Wrapper>
        <H3>Entered PIN for { props.device.label } is not correct</H3>
        <P isSmaller>Retrying...</P>
    </Wrapper>
);

InvalidPin.propTypes = {
    device: PropTypes.object.isRequired,
};

export default InvalidPin;