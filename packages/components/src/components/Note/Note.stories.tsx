import { type Meta, type StoryObj } from '@storybook/react';

import * as generatedIcons from '@trezor/icons';

import { Note as NoteComponent, type NoteProps, allowedNoteFrameProps } from './Note';
import { getFramePropsStory } from '../../utils/frameProps';
import { textIntents, textPriorities } from '../typography/Text/Text';

const meta: Meta<typeof NoteComponent> = {
    title: 'Note',
    component: NoteComponent,
};
export default meta;

export const Note: StoryObj<NoteProps> = {
    args: {
        icon: generatedIcons.InfoIcon,
        intent: 'neutral',
        priority: 'secondary',
        isDisabled: false,
        children: 'Example tooltip',
        ...getFramePropsStory(allowedNoteFrameProps).args,
    },
    argTypes: {
        icon: {
            options: ['none', ...Object.keys(generatedIcons)],
            mapping: { none: undefined, ...generatedIcons },
            control: { type: 'select' },
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
