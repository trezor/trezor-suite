/* @flow */

import React from 'react';
import styled from 'styled-components';
import { H3 } from 'components/Heading';
import P from 'components/Paragraph';
import { CONTEXT_DEVICE } from 'actions/constants/modal';

import type { Props } from '../../index';

const Wrapper = styled.div`
    padding: 24px 48px;
`;

const InvalidPin = (props: Props) => {
    if (props.modal.context !== CONTEXT_DEVICE) return null;

    const { device } = props.modal;
    return (
        <Wrapper>
            <H3>Entered PIN for { device.label } is not correct</H3>
            <P isSmaller>Retrying...</P>
        </Wrapper>
    );
};

export default InvalidPin;