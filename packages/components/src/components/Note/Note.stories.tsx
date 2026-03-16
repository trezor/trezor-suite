import { type Meta, type StoryObj } from '@storybook/react';

import { Note as NoteComponent, type NoteProps, allowedNoteFrameProps } from './Note';
import { variables } from '../../config';
import { getFramePropsStory } from '../../utils/frameProps';
import { textIntents, textPriorities } from '../typography/Text/Text';

const meta: Meta<typeof NoteComponent> = {
    title: 'Note',
    component: NoteComponent,
};
export default meta;

export const Note: StoryObj<NoteProps> = {
    args: {
        iconName: 'info',
        intent: 'neutral',
        priority: 'secondary',
        isDisabled: false,
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
        intent: {
            options: textIntents,
            control: {
                type: 'select',
            },
        },
        priority: {
            options: textPriorities,
            control: {
                type: 'radio',
            },
        },
        isDisabled: {
            control: {
                type: 'boolean',
            },
        },
        ...getFramePropsStory(allowedNoteFrameProps).argTypes,
    },
};
