import { Meta, StoryObj } from '@storybook/react';

import {
    NewButton as NewButtonComponent,
    NewButtonProps,
    allowedNewButtonFrameProps,
} from './NewButton';
import { newButtonIntents, newButtonPriorities, newButtonSizes } from './types';
import { variables } from '../../../config';
import { getFramePropsStory } from '../../../utils/frameProps';

const meta: Meta<NewButtonProps> = {
    title: 'Buttons',
    component: NewButtonComponent,
};

export default meta;

export const NewButton: StoryObj<NewButtonProps> = {
    args: {
        children: 'Placeholder',
        onClick: () => null,
        href: undefined,
        target: undefined,
        intent: 'brand',
        priority: 'primary',
        size: 'medium',
        isDisabled: false,
        isLoading: false,
        isInverse: false,
        ...getFramePropsStory(allowedNewButtonFrameProps).args,
    },
    argTypes: {
        href: {
            type: 'string',
        },
        target: {
            type: 'string',
        },
        intent: {
            control: { type: 'select' },
            options: newButtonIntents,
        },
        priority: {
            control: { type: 'select' },
            options: newButtonPriorities,
        },
        size: {
            control: { type: 'select' },
            options: newButtonSizes,
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
        iconLeft: {
            options: [null, ...variables.ICONS],
            control: { type: 'select' },
        },
        iconRight: {
            options: [null, ...variables.ICONS],
            control: { type: 'select' },
        },
        ...getFramePropsStory(allowedNewButtonFrameProps).argTypes,
    },
};
