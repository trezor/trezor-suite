import React from 'react';

import { StoryWrapper } from '../src/support/Story';

export const decorators = [
    (Story, context) => {
        const story = () => React.createElement(Story, null);

        return context?.parameters?.noWrapper
            ? story()
            : React.createElement(StoryWrapper, null, story());
    },
];

export const parameters = {
    options: {
        showPanel: true,
        showInfo: true,
        panelPosition: 'right',
    },
    theme: {
        base: 'light',
    },
};
export const tags = ['autodocs'];
