import { LoadSkiaWeb } from '@shopify/react-native-skia/lib/module/web';
import { Preview } from '@storybook/react';
import { INITIAL_VIEWPORTS } from 'storybook/viewport';

import { alertRendererDecorator } from '../decorators/alertRendererDecorator';
import { bottomSheetDecorator } from '../decorators/bottomSheetDecorator';
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
    decorators: [alertRendererDecorator, bottomSheetDecorator, ...SHARED_DECORATORS],
    beforeAll: async () => {
        await LoadSkiaWeb();
    },
};

export default preview;
