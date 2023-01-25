import React from 'react';
import { ComponentStory } from '@storybook/react';

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
    },
};

export const Basic: ComponentStory<typeof Note> = args => <Note>{args.children}</Note>;
