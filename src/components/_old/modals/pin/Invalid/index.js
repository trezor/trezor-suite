import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import { H3 } from 'components/Heading';
import P from 'components/Paragraph';

const Wrapper = styled.div`
    padding: 24px 48px;
`;

const InvalidPin = props => (
    <Wrapper>
        <H3>Entered PIN for { props.device.label } is not correct</H3>
        <P isSmaller>Retrying...</P>
    </Wrapper>
);

InvalidPin.propTypes = {
    device: PropTypes.object.isRequired,
};

export default InvalidPin;