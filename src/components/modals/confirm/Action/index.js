/* @flow */

import React from 'react';
import styled from 'styled-components';
import { H3 } from 'components/Heading';
import ICONS from 'config/icons';
import Icon from 'components/Icon';

const Wrapper = styled.div``;

const Header = styled.div`
    padding: 48px;
`;

const ConfirmAction = () => (
    <Wrapper>
        <Header>
            <Icon icon={ICONS.T1} size={100} />
            <H3>Confirm action on your Trezor</H3>
        </Header>
    </Wrapper>
);

export default ConfirmAction;