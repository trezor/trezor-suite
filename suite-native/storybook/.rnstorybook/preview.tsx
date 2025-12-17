import type { Preview } from '@storybook/react-native';

import { themeDecorator } from '../themeDecorator';

const preview: Preview = {
    argTypes: {
        theme: {
            options: ['standard', 'dark'],
            control: { type: 'radio' },
        },
    },
    args: {
        theme: 'standard',
    },
    parameters: {
        controls: {
            matchers: {
                color: /(background|color)$/i,
                date: /Date$/,
            },
        },
    },
    decorators: [themeDecorator],
};

export default preview;
