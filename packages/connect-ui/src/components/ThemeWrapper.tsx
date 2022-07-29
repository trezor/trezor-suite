import React from 'react';

import styled, { ThemeProvider } from 'styled-components';

import { THEME } from '@trezor/components';

const View = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    min-height: 100vh;
`;

interface ReactWrapperProps {
    children: React.ReactNode;
}

export const ThemeWrapper = ({ children }: ReactWrapperProps) => (
    <ThemeProvider theme={THEME.light}>
        <View>{children}</View>
    </ThemeProvider>
);
