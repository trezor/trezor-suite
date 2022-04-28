import React, { useCallback, useEffect, useState } from 'react';

import { StylesProvider, createRenderer } from '@trezor/styles';
import { prepareNativeTheme } from '@trezor/theme';

import { Home } from './screens/Home';

const renderer = createRenderer();

export const App = () => {
    const theme = prepareNativeTheme({ colorVariant: 'standard' });

    return (
        <StylesProvider theme={theme} renderer={renderer}>
            <Home />
        </StylesProvider>
    );
};
