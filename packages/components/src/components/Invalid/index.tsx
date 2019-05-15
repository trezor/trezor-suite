import { H6 } from '../Heading';
import P from '../Paragraph';
import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
    padding: 24px 48px;
`;

interface Props {
    device: {
        label: string;
    };
}

const InvalidPin = ({ device }: Props) => (
    <Wrapper>
        <H6>Entered PIN for {device.label} is not correct</H6>
        <P size="small">Retrying...</P>
    </Wrapper>
);

InvalidPin.propTypes = {
    device: PropTypes.object.isRequired,
};

export default InvalidPin;
