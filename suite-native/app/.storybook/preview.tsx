import type { Preview } from '@storybook/react';

const preview: Preview = {
    parameters: {
        // actions: { argTypesRegex: "^on[A-Z].*" },
        controls: {
            matchers: {
                color: /(background|color)$/i,
                date: /Date$/,
            },
        },
    },

    tags: ['autodocs'],
};

// eslint-disable-next-line import/no-default-export
export default preview;
