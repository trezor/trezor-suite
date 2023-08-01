import React from 'react';
import styled, { ThemeProvider } from 'styled-components';

import { THEME } from '@trezor/components';
import { Menu } from './Menu';

const MainComponent = styled.main`
    max-width: 1170px;
    padding-top: 150px;
    padding-bottom: 25px;
    margin: 0 auto;
    background: ${THEME.light.BG_LIGHT_GREY};
    display: flex;
    flex-direction: row;

    @media (min-width: 640px) {
        padding-top: 90px;
    }
`;

interface MainProps {
    children: React.ReactNode;
}

export const Main = ({ children }: MainProps) => (
    <ThemeProvider theme={THEME.light}>
        <MainComponent>
            <Menu />
            {children}
        </MainComponent>
    </ThemeProvider>
);
