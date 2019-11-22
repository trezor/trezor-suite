import React from 'react';
import { Props } from './Container';
import { colors } from '@trezor/components-v2';
import styled from 'styled-components';
import Apps from './components/Apps';

const Wrapper = styled.div`
    background: ${colors.BLACK17};
    width: 120px;
    display: flex;
    flex-direction: column;
    padding-top: 100px;
`;

const Menu = (props: Props) => {
    return (
        <Wrapper>
            <Apps app={props.router.app} goTo={props.goto} />
        </Wrapper>
    );
};

export default Menu;
