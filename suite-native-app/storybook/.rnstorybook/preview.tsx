import type { Preview } from '@storybook/react-native';

import { SHARED_DECORATORS } from '../decorators/decorators';

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
    decorators: [...SHARED_DECORATORS],
};

export default preview;
