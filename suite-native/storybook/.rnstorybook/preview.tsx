import React from 'react';

import type { Preview } from '@storybook/react-native';

import { Box } from '@suite-native/atoms';

const preview: Preview = {
    parameters: {
        controls: {
            matchers: {
                color: /(background|color)$/i,
                date: /Date$/,
            },
        },
    },
    decorators: [
        Story => (
            <Box paddingTop="sp64" flex={1} alignItems="center">
                <Story />
            </Box>
        ),
    ],
};

// eslint-disable-next-line import/no-default-export
export default preview;
