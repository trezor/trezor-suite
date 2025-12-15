import type { Meta, StoryObj } from '@storybook/react';

import type { NoteProps } from './Note';
import { Note as NoteComponent, allowedNoteFrameProps } from './Note';
import { variables } from '../../config';
import { getFramePropsStory } from '../../utils/frameProps';

const meta: Meta<typeof NoteComponent> = {
    title: 'Note',
    component: NoteComponent,
};
export default meta;

export const Note: StoryObj<NoteProps> = {
    args: {
        iconName: 'info',
        children: 'Example tooltip',
        ...getFramePropsStory(allowedNoteFrameProps).args,
    },
    argTypes: {
        iconName: {
            options: variables.ICONS,
            control: {
                type: 'select',
            },
        },
        ...getFramePropsStory(allowedNoteFrameProps).argTypes,
    },
};
