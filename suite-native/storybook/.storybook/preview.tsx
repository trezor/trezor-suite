import { Preview } from '@storybook/react';

import { themeDecorator } from '../themeDecorator';

import './fonts.css';

const preview: Preview = {
    parameters: {
        controls: {
            matchers: {
                color: /(background|color)$/i,
                date: /Date$/,
            },
        },
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
    decorators: [themeDecorator],
};

export default preview;
