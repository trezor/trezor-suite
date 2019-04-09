import { H6 } from 'components/Heading';
import P from 'components/Paragraph';
import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
    padding: 24px 48px;
`;

const InvalidPin = props => (
    <Wrapper>
        <H6>Entered PIN for {props.device.label} is not correct</H6>
        <P size="small">Retrying...</P>
    </Wrapper>
);

InvalidPin.propTypes = {
    device: PropTypes.object.isRequired,
};

export default InvalidPin;
