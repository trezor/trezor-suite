import React from 'react';
import { Props } from './Container';
import { colors } from '@trezor/components';
import styled from 'styled-components';

import TopMenu from './components/TopMenu';
import MainMenu from './components/MainMenu';
import BottomMenu from './components/BottomMenu';

const Wrapper = styled.div<{ wide?: boolean }>`
    background: ${colors.BLACK17};
    width: ${props => (props.wide ? '100%' : '140px')};
    height: 100%;
    display: flex;
    flex-direction: column;
`;

const Menu = (props: Props) => {
    return (
        <Wrapper wide={props.fullWidth}>
            <TopMenu
                deviceCount={props.devices.length}
                selectedDevice={props.selectedDevice}
                goto={props.goto}
            />
            <MainMenu
                app={props.router.app}
                goto={props.goto}
                openSecondaryMenu={props.openSecondaryMenu}
            />
            <BottomMenu
                app={props.router.app}
                goto={props.goto}
                openSecondaryMenu={props.openSecondaryMenu}
                discreetMode={props.discreetMode}
                setDiscreetMode={props.setDiscreetMode}
            />
        </Wrapper>
    );
};

export default Menu;
