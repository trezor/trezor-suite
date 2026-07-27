import { type Meta, type StoryObj } from '@storybook/react';
import { action } from 'storybook/actions';

import * as generatedIcons from '@trezor/icons';

import {
    IconButton as IconButtonComponent,
    type IconButtonProps,
    allowedIconButtonFrameProps,
} from './IconButton';
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
        icon: generatedIcons.AddressBookFilledIcon,
        intent: 'brand',
        priority: 'primary',
        size: 'medium',
        isDisabled: false,
        isLoading: false,
        isInverse: false,
        isFloating: false,
        tooltip: { content: 'Address book' },
        ...getFramePropsStory(allowedIconButtonFrameProps).args,
    },
    argTypes: {
        icon: {
            options: Object.keys(generatedIcons),
            mapping: generatedIcons,
            control: { type: 'select' },
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
        ...getFramePropsStory(allowedIconButtonFrameProps).argTypes,
    },
};
