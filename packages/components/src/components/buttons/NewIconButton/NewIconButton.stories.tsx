import { Meta, StoryObj } from '@storybook/react';

import {
    NewIconButton as NewIconButtonComponent,
    NewIconButtonProps,
    allowedNewIconButtonFrameProps,
} from './NewIconButton';
import { variables } from '../../../config';
import { getFramePropsStory } from '../../../utils/frameProps';
import { newButtonIntents, newButtonPriorities, newButtonSizes } from '../types';

const meta: Meta<NewIconButtonProps> = {
    title: 'Buttons',
    component: NewIconButtonComponent,
};

export default meta;

export const NewIconButton: StoryObj<NewIconButtonProps> = {
    args: {
        onClick: () => null,
        icon: 'addressBookFilled',
        intent: 'brand',
        priority: 'primary',
        size: 'medium',
        isDisabled: false,
        isLoading: false,
        isInverse: false,
        ...getFramePropsStory(allowedNewIconButtonFrameProps).args,
    },
    argTypes: {
        icon: {
            options: variables.ICONS,
            control: { type: 'select' },
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
        ...getFramePropsStory(allowedNewIconButtonFrameProps).argTypes,
    },
};
