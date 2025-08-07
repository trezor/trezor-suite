import { Meta, StoryObj } from '@storybook/react';

import { Note as NoteComponent, NoteProps, allowedNoteFrameProps } from './Note';
import { getFramePropsStory } from '../../utils/frameProps';
import { iconNames } from '../Icon/constants';

const meta: Meta = {
    title: 'Note',
    component: NoteComponent,
} as Meta;
export default meta;

export const Note: StoryObj<NoteProps> = {
    args: {
        icon: 'info',
        children: 'Example tooltip',
        ...getFramePropsStory(allowedNoteFrameProps).args,
    },
    argTypes: {
        icon: {
            options: iconNames,
            control: {
                type: 'select',
            },
        },
        ...getFramePropsStory(allowedNoteFrameProps).argTypes,
    },
};
