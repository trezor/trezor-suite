import { type Meta, type StoryObj } from '@storybook/react';
import { action } from 'storybook/actions';

import {
    IconButton as IconButtonComponent,
    type IconButtonProps,
    allowedIconButtonFrameProps,
} from './IconButton';
import { variables } from '../../../config';
import { getFramePropsStory } from '../../../utils/frameProps';
import { buttonIntents, buttonPriorities, buttonSizes } from '../types';

const meta: Meta<IconButtonProps> = {
    title: '🫵 Buttons',
    component: IconButtonComponent,
};

export default meta;

export const IconButton: StoryObj<IconButtonProps> = {
    args: {
        onClick: action('onClick'),
        icon: 'addressBookFilled',
        intent: 'brand',
        priority: 'primary',
        size: 'medium',
        isDisabled: false,
        isLoading: false,
        isInverse: false,
        ...getFramePropsStory(allowedIconButtonFrameProps).args,
    },
    argTypes: {
        href: {
            type: 'string',
        },
        target: {
            type: 'string',
        },
        icon: {
            options: variables.ICONS,
            control: { type: 'select' },
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
        ...getFramePropsStory(allowedIconButtonFrameProps).argTypes,
    },
};
