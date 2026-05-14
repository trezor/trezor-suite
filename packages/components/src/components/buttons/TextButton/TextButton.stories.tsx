import { type Meta, type StoryObj } from '@storybook/react';
import { action } from 'storybook/actions';

import {
    TextButton as TextButtonComponent,
    type TextButtonProps,
    allowedTextButtonFrameProps,
} from './TextButton';
import { textButtonSizes } from './types';
import { variables } from '../../../config';
import { getFramePropsStory } from '../../../utils/frameProps';
import { buttonIntents, buttonPriorities } from '../types';

const meta: Meta<typeof TextButtonComponent> = {
    title: '🫵 Buttons',
    component: TextButtonComponent,
};
export default meta;

export const TextButton: StoryObj<TextButtonProps> = {
    args: {
        children: 'Button label',
        onClick: action('onClick'),
        intent: 'brand',
        priority: 'primary',
        size: 'large',
        isInverse: false,
        isDisabled: false,
        isLoading: false,
        isUnderlined: false,
        ...getFramePropsStory(allowedTextButtonFrameProps).args,
    },
    argTypes: {
        children: {
            type: 'string',
        },
        href: {
            type: 'string',
        },
        target: {
            type: 'string',
        },
        intent: {
            control: {
                type: 'select',
            },
            options: buttonIntents,
        },
        priority: {
            control: {
                type: 'select',
            },
            options: buttonPriorities,
        },
        iconLeft: {
            options: [null, ...variables.ICONS],
            control: { type: 'select' },
        },
        iconRight: {
            options: [null, ...variables.ICONS],
            control: { type: 'select' },
        },
        size: {
            control: {
                type: 'select',
            },
            options: textButtonSizes,
        },
        isInverse: {
            control: {
                type: 'boolean',
            },
        },
        isDisabled: {
            control: {
                type: 'boolean',
            },
        },
        isLoading: {
            control: {
                type: 'boolean',
            },
        },
        isUnderlined: {
            control: {
                type: 'boolean',
            },
        },
        ...getFramePropsStory(allowedTextButtonFrameProps).argTypes,
    },
};
