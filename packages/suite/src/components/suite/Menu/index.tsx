import React from 'react';
import { Props } from './Container';
import { colors } from '@trezor/components-v2';
import styled from 'styled-components';

import TopMenu from './components/TopMenu';
import MainMenu from './components/MainMenu';
import BottomMenu from './components/BottomMenu';

const Wrapper = styled.div`
    background: ${colors.BLACK17};
    width: 120px;
    display: flex;
    height: 100vh;
    flex-direction: column;
`;

const Menu = (props: Props) => {
    return (
        <Wrapper>
            <TopMenu selectedDevice={props.selectedDevice} />
            <MainMenu app={props.router.app} goto={props.goto} />
            <BottomMenu goto={props.goto} />
        </Wrapper>
    );
};

export default Menu;
