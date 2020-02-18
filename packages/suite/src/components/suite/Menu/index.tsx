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
    flex-direction: column;
`;

const Menu = (props: Props) => {
    return (
        <Wrapper>
            <TopMenu
                deviceCount={props.devices.length}
                selectedDevice={props.selectedDevice}
                goto={props.goto}
            />
            <MainMenu app={props.router.app} goto={props.goto} />
            <BottomMenu
                app={props.router.app}
                goto={props.goto}
                discreetMode={props.discreetMode}
                setDiscreetMode={props.setDiscreetMode}
            />
        </Wrapper>
    );
};

export default Menu;
