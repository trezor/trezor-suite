import { Meta, StoryObj } from '@storybook/react';
import { Note as NoteComponent, NoteProps } from './Note';

export default {
    title: 'Misc/Note',
    component: NoteComponent,
} as Meta;

export const Note: StoryObj<NoteProps> = {
    args: {
        children: 'Example tooltip',
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
