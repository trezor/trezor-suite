/* @flow */

import React from 'react';
import styled from 'styled-components';
import { H3 } from 'components/Heading';

const Wrapper = styled.div``;

const Header = styled.div`
    padding: 48px;
`;

const ConfirmAction = () => (
    <Wrapper>
        <Header>
            <H3>Confirm Action on your Trezor</H3>
        </Header>
    </Wrapper>
);

export default ConfirmAction;