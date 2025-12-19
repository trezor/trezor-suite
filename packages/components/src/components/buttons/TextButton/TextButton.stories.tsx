import { Meta, StoryObj } from '@storybook/react';
import { action } from 'storybook/actions';

import {
    TextButton as TextButtonComponent,
    TextButtonProps,
    allowedTextButtonFrameProps,
} from './TextButton';
import { textButtonSizes } from './types';
import { variables } from '../../../config';
import { getFramePropsStory } from '../../../utils/frameProps';
import { buttonIntents } from '../types';

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
        size: 'large',
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
