import { LoadSkiaWeb } from '@shopify/react-native-skia/lib/module/web';
import { Preview } from '@storybook/react';
import { INITIAL_VIEWPORTS } from 'storybook/viewport';

LoadSkiaWeb();

import { SHARED_DECORATORS } from '../decorators/decorators';

import './fonts.css';

const preview: Preview = {
    parameters: {
        controls: {
            matchers: {
                color: /(background|color)$/i,
                date: /Date$/,
            },
        },
        layout: 'fullscreen',
        options: {
            showPanel: true,
            showInfo: true,
            panelPosition: 'right',
        },

        viewport: {
            options: INITIAL_VIEWPORTS,
        },
    },
    initialGlobals: {
        viewport: { value: 'iphonex', isRotated: false },
    },
    globalTypes: {
        theme: {
            defaultValue: 'standard',
            toolbar: {
                icon: 'circlehollow',
                items: [
                    { value: 'standard', icon: 'circlehollow', title: 'Standard' },
                    { value: 'dark', icon: 'circle', title: 'Dark' },
                ],
            },
        },
    },
    decorators: [...SHARED_DECORATORS],
};

export default preview;
