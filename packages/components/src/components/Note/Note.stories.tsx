import { Meta, StoryObj } from '@storybook/react';
import { Note as NoteComponent, NoteProps } from './Note';

const meta: Meta = {
    title: 'Misc/Note',
    component: NoteComponent,
} as Meta;
export default meta;

export const Note: StoryObj<NoteProps> = {
    args: {
        children: 'Example tooltip',
    },
    argTypes: {
        className: {
            control: false,
        },
    },
};
