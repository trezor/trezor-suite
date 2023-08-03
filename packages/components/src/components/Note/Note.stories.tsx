import React from 'react';
import { StoryObj } from '@storybook/react';

import { Note } from './Note';

export default {
    title: 'Note',
    args: {
        children: 'Note: this is a note',
    },
    argTypes: {
        className: {
            control: false,
        },
        color: {
            control: 'color',
        },
    },
};

export const Basic: StoryObj<typeof Note> = {
    render: args => <Note color={args.color}>{args.children}</Note>,
};
