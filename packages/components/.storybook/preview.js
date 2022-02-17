import React from 'react';
import { StoryWrapper } from '../src/support/Story';

export const decorators = [
    Story => (
        <StoryWrapper>
            <Story />
        </StoryWrapper>
    ),
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
