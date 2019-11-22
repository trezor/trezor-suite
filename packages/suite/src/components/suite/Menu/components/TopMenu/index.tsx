import React from 'react';
import styled from 'styled-components';
import { colors } from '@trezor/components-v2';
import Divider from '../Divider';
import { MENU_PADDING } from '@suite-constants/menu';

const Wrapper = styled.div`
    padding: ${MENU_PADDING}px 10px;
    background: ${colors.BLACK17};
    display: flex;
    margin-top: 5px;
    flex-direction: column;
`;

const Text = styled.div``;

const BottomMenu = () => (
    <Wrapper>
        <Text>aaaa</Text>
        <Divider />
    </Wrapper>
);

export default BottomMenu;
