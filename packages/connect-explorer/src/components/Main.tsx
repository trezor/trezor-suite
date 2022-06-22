import React from 'react';
import styled, { ThemeProvider } from 'styled-components';

import { THEME } from '@trezor/components';
import Menu from './Menu';

const MainComponent = styled.main`
    max-width: 1170px;
    min-width: 800px;
    min-height: 100%;
    padding-top: 90px;
    padding-bottom: 25px;
    margin: 0 auto;
    background: ${THEME.light.BG_LIGHT_GREY};
    display: flex;
    flex-direction: row;
`;

const Main: React.FC = ({ children }) => (
    <ThemeProvider theme={THEME.light}>
        <MainComponent>
            <Menu />
            {children}
        </MainComponent>
    </ThemeProvider>
);

export default Main;
