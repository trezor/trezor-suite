import { type Meta, type StoryObj } from '@storybook/react';
import { action } from 'storybook/actions';

import { Button as ButtonComponent, type ButtonProps, allowedButtonFrameProps } from './Button';
import { variables } from '../../../config';
import { getFramePropsStory } from '../../../utils/frameProps';
import { buttonIntents, buttonPriorities, buttonSizes } from '../types';

const meta: Meta<ButtonProps> = {
    title: '🫵 Buttons',
    component: ButtonComponent,
};

export default meta;

export const Button: StoryObj<ButtonProps> = {
    args: {
        children: 'Placeholder',
        onClick: action('onClick'),
        intent: 'brand',
        priority: 'primary',
        size: 'medium',
        isDisabled: false,
        isLoading: false,
        isInverse: false,
        isFloating: false,
        shortcut: undefined,
        ...getFramePropsStory(allowedButtonFrameProps).args,
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
            control: { type: 'select' },
            options: buttonIntents,
        },
        priority: {
            control: { type: 'select' },
            options: buttonPriorities,
        },
        size: {
            control: { type: 'select' },
            options: buttonSizes,
        },
        isDisabled: {
            type: 'boolean',
        },
        isLoading: {
            type: 'boolean',
        },
        isInverse: {
            type: 'boolean',
        },
        isFloating: {
            type: 'boolean',
        },
        iconLeft: {
            options: [null, ...variables.ICONS],
            control: { type: 'select' },
        },
        iconRight: {
            options: [null, ...variables.ICONS],
            control: { type: 'select' },
        },
        shortcut: {
            control: { type: 'select' },
            options: [undefined, 'example'],
            mapping: {
                undefined,
                example: ['CTRL', 'KEY_P'],
            },
        },
        ...getFramePropsStory(allowedButtonFrameProps).argTypes,
    },
};
